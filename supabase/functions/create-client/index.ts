import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateReferenceCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['SUPER_ADMIN', 'ADMIN', 'OPS'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      email,
      password,
      name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postcode,
      date_of_birth,
      date_of_birth_holder2,
      company_incorporation_date,
      country_of_residence,
      account_type,
      base_currency,
      tax_residency,
      risk_profile,
      kyc_documents_approved,
      assigned_advisor_name,
      member_since,
      selected_investment_id,
      investment_amount
    } = await req.json();

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (selected_investment_id && investment_amount) {
      const { data: instrument } = await supabaseClient
        .from('instruments')
        .select('metadata_json')
        .eq('id', selected_investment_id)
        .single();

      if (instrument) {
        const minInvestment = instrument.metadata_json?.minimum_investment || 0;
        if (investment_amount < minInvestment) {
          return new Response(
            JSON.stringify({ error: `Investment amount must be at least ${minInvestment}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const { data: signUpData, error: signUpError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
      },
    });

    if (signUpError) {
      return new Response(
        JSON.stringify({ error: signUpError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signUpData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = signUpData.user.id;

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: newUserId,
        name,
        phone,
        role: 'CLIENT',
      });

    if (profileError) {
      await supabaseClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Profile creation failed: ' + profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentReferenceCode = generateReferenceCode();

    const { data: clientData, error: clientError } = await supabaseClient
      .from('clients')
      .insert({
        user_id: newUserId,
        account_type: account_type || 'INDIVIDUAL',
        base_currency: base_currency || 'USD',
        address_line1: address_line1,
        address_line2: address_line2,
        city: city,
        state: state,
        postcode: postcode,
        date_of_birth: date_of_birth || null,
        date_of_birth_holder2: date_of_birth_holder2 || null,
        company_incorporation_date: company_incorporation_date || null,
        country_of_residence: country_of_residence,
        tax_residency: tax_residency,
        risk_profile: risk_profile,
        kyc_documents_approved: kyc_documents_approved || false,
        assigned_advisor_name: assigned_advisor_name,
        payment_reference_code: paymentReferenceCode,
        member_since: member_since || new Date().toISOString().split('T')[0],
        kyc_status: kyc_documents_approved ? 'APPROVED' : 'PENDING',
      })
      .select('id')
      .single();

    if (clientError) {
      await supabaseClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Client creation failed: ' + clientError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: cashBalanceError } = await supabaseClient
      .from('cash_balances')
      .insert({
        client_id: clientData.id,
        currency: base_currency || 'USD',
        balance: 0,
      });

    if (cashBalanceError) {
      console.error('Cash balance creation failed:', cashBalanceError);
    }

    if (selected_investment_id && investment_amount) {
      const { data: instrument } = await supabaseClient
        .from('instruments')
        .select('*')
        .eq('id', selected_investment_id)
        .single();

      if (instrument) {
        const termYears = instrument.metadata_json?.term_years || 1;
        const termMonths = termYears * 12;
        
        const { error: holdingError } = await supabaseClient
          .from('holdings')
          .insert({
            client_id: clientData.id,
            instrument_id: selected_investment_id,
            currency: instrument.currency,
            face_or_units: investment_amount,
            price: 100,
            cost_basis: investment_amount,
            current_value: investment_amount,
            start_date: new Date().toISOString().split('T')[0],
            term_months: termMonths,
            payment_frequency: 'BIANNUAL',
            status: 'PENDING',
          });

        if (holdingError) {
          console.error('Pending holding creation failed:', holdingError);
        }
      }
    }

    await supabaseClient
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'CREATE_CLIENT',
        entity: 'CLIENT',
        entity_id: newUserId,
        after_json: {
          email,
          name,
          account_type: account_type || 'INDIVIDUAL',
          payment_reference_code: paymentReferenceCode,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        client_id: clientData.id,
        payment_reference_code: paymentReferenceCode,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in create-client function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});