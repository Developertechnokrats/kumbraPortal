import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

type EmailType = 'WELCOME' | 'KYC_APPROVED' | 'KYC_REJECTED';

const portalUrl = 'https://kumbrasecure.com/auth/signin';

function getEmailTemplate({
  type,
  name,
  email,
  password,
  documentTitle,
}: {
  type: EmailType;
  name?: string;
  email?: string;
  password?: string;
  documentTitle?: string;
}) {
  const clientName = name || 'Client';

  if (type === 'WELCOME') {
    return {
      subject: 'Welcome to Kumbra Capital Client Portal',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
          <h2>Welcome to Kumbra Capital</h2>
          <p>Hello ${clientName},</p>
          <p>Your Kumbra Capital client portal account has been created successfully.</p>

          <p><strong>Client Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
          <p><strong>Email:</strong> ${email || ''}</p>
          <p><strong>Password:</strong> ${password || ''}</p>

          <p>Please keep your login details secure.</p>
          <p>Regards,<br/>Kumbra Capital</p>
        </div>
      `,
    };
  }

  if (type === 'KYC_APPROVED') {
    return {
      subject: 'Your KYC document has been approved',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
          <h2>KYC Approved</h2>
          <p>Hello ${clientName},</p>
          <p>Your KYC document${documentTitle ? ` <strong>${documentTitle}</strong>` : ''} has been approved.</p>
          <p>You can log in to your client portal here:</p>
          <p><a href="${portalUrl}">${portalUrl}</a></p>
          <p>Regards,<br/>Kumbra Capital</p>
        </div>
      `,
    };
  }

  return {
    subject: 'Your KYC document needs attention',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
        <h2>KYC Document Rejected</h2>
        <p>Hello ${clientName},</p>
        <p>Your KYC document${documentTitle ? ` <strong>${documentTitle}</strong>` : ''} was rejected.</p>
        <p>Please log in to your client portal and upload a corrected document.</p>
        <p><a href="${portalUrl}">${portalUrl}</a></p>
        <p>Regards,<br/>Kumbra Capital</p>
      </div>
    `,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      to,
      type,
      name,
      email,
      password,
      documentTitle,
    }: {
      to?: string;
      type?: EmailType;
      name?: string;
      email?: string;
      password?: string;
      documentTitle?: string;
    } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required.' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Email type is required.' },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom =
      process.env.SMTP_FROM || 'Kumbra Capital <kumbra@tech.scriptdaddy.net>';

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json(
        { success: false, error: 'SMTP environment variables are missing.' },
        { status: 500 }
      );
    }

    const template = getEmailTemplate({
      type,
      name,
      email,
      password,
      documentTitle,
    });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      requireTLS: smtpPort === 587,
    });

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: template.subject,
      html: template.html,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully.',
    });
  } catch (error: any) {
    console.error('Send email API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to send email.',
      },
      { status: 500 }
    );
  }
}