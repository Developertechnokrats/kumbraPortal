import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const { data: application, error: appError } = await supabaseAdmin
      .from('account_applications')
      .select('*')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) throw appError;

    if (!application) {
      return NextResponse.json(
        { error: 'No application found for this email.' },
        { status: 404 }
      );
    }

    const fullName =
      `${application.first_name || ''} ${application.last_name || ''}`.trim() ||
      application.corporate_company_name ||
      'Client';

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();

    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            name: fullName,
          },
        });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create auth user.');
      }

      userId = authData.user.id;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        role: 'CLIENT',
        name: fullName,
        phone: application.phone || null,
        locale: 'en',
        is_demo: false,
      });

    if (profileError) throw profileError;

    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingClient) {
      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          user_id: userId,
          account_type: 'INDIVIDUAL',
          base_currency: application.preferred_currency || 'GBP',
          kyc_status: 'PENDING',
          bank_verified: false,
          country_of_residence: application.country || null,
          risk_profile: application.risk_tolerance || null,
          date_of_birth: application.date_of_birth || null,
          payment_account_name: application.bank_account_holder || null,
          payment_account_number: application.bank_account_number || null,
          account_status: 'ACTIVE',
        });

      if (clientError) throw clientError;
    }

    await supabaseAdmin
      .from('account_applications')
      .update({
        status: 'PORTAL_CREATED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id);

    return NextResponse.json({
      success: true,
      userId,
      message: 'Client portal account created successfully.',
    });
  } catch (error: any) {
    console.error('Create client from application error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to create client account.' },
      { status: 500 }
    );
  }
}