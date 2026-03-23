import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    const formData = await req.formData();
    
    const to = formData.get('to') as string || '';
    const from = formData.get('from') as string || '';
    const subject = formData.get('subject') as string || '';
    const text = formData.get('text') as string || '';
    const html = formData.get('html') as string || '';
    const headers = formData.get('headers') as string || '{}';
    
    let fromName = '';
    let fromAddress = from;
    
    const fromMatch = from.match(/(.+?)\s*<(.+?)>/);
    if (fromMatch) {
      fromName = fromMatch[1].trim();
      fromAddress = fromMatch[2].trim();
    }
    
    const toAddress = to.includes('<') ? to.match(/<(.+?)>/)?.[1] || to : to;
    
    const attachmentsCount = formData.get('attachments') || '0';
    const attachments = [];
    
    for (let i = 1; i <= parseInt(attachmentsCount as string); i++) {
      const attachmentInfo = formData.get(`attachment${i}`) as string;
      if (attachmentInfo) {
        try {
          attachments.push(JSON.parse(attachmentInfo));
        } catch {
          attachments.push({ name: attachmentInfo });
        }
      }
    }
    
    let clientId = null;
    const { data: clients } = await supabaseClient
      .from('clients')
      .select('id, profiles!clients_user_id_fkey(id)')
      .or(`profiles.email.eq.${fromAddress}`);
    
    if (clients && clients.length > 0) {
      clientId = clients[0].id;
    }
    
    const { error: insertError } = await supabaseClient
      .from('inbound_emails')
      .insert({
        to_address: toAddress,
        from_address: fromAddress,
        from_name: fromName,
        subject: subject,
        text_body: text,
        html_body: html,
        headers_json: JSON.parse(headers || '{}'),
        attachments_json: attachments.length > 0 ? attachments : null,
        client_id: clientId,
      });

    if (insertError) {
      console.error('Error inserting email:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email received' }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing inbound email:', error);
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