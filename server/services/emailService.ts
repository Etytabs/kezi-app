import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then((data: any) => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Kezi <noreply@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Email sent successfully:', result.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendVerificationEmail(
  email: string, 
  code: string, 
  userName: string,
  language: string = 'en'
): Promise<{ success: boolean; error?: string }> {
  const subjects: Record<string, string> = {
    en: 'Verify your Kezi account',
    fr: 'Vérifiez votre compte Kezi',
    rw: 'Emeza konti yawe ya Kezi'
  };

  const html = getVerificationEmailTemplate(code, userName, language);
  const text = getVerificationEmailText(code, userName, language);

  return sendEmail({
    to: email,
    subject: subjects[language] || subjects.en,
    html,
    text
  });
}

export async function sendPasswordResetEmail(
  email: string,
  code: string,
  userName: string,
  language: string = 'en'
): Promise<{ success: boolean; error?: string }> {
  const subjects: Record<string, string> = {
    en: 'Reset your Kezi password',
    fr: 'Réinitialisez votre mot de passe Kezi',
    rw: 'Hindura ijambo ryibanga ryawe rya Kezi'
  };

  const html = getPasswordResetEmailTemplate(code, userName, language);
  const text = getPasswordResetEmailText(code, userName, language);

  return sendEmail({
    to: email,
    subject: subjects[language] || subjects.en,
    html,
    text
  });
}

function getVerificationEmailTemplate(code: string, userName: string, language: string): string {
  const content: Record<string, { greeting: string; message: string; codeLabel: string; expires: string; footer: string }> = {
    en: {
      greeting: `Hi ${userName},`,
      message: 'Welcome to Kezi! Please verify your email address by entering this code in the app:',
      codeLabel: 'Your verification code:',
      expires: 'This code expires in 15 minutes.',
      footer: 'If you didn\'t create a Kezi account, you can safely ignore this email.'
    },
    fr: {
      greeting: `Bonjour ${userName},`,
      message: 'Bienvenue sur Kezi! Veuillez vérifier votre adresse email en entrant ce code dans l\'application:',
      codeLabel: 'Votre code de vérification:',
      expires: 'Ce code expire dans 15 minutes.',
      footer: 'Si vous n\'avez pas créé de compte Kezi, vous pouvez ignorer cet email.'
    },
    rw: {
      greeting: `Muraho ${userName},`,
      message: 'Murakaza neza kuri Kezi! Nyamuneka emeza imeri yawe ushyiramo iyi kode muri porogaramu:',
      codeLabel: 'Kode yawe yo kwemeza:',
      expires: 'Iyi kode izashira mu minota 15.',
      footer: 'Niba utaremye konti ya Kezi, urashobora kwirengagiza iyi email.'
    }
  };

  const c = content[language] || content.en;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Kezi Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1A1025;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #E8B4D8 0%, #9B7BB8 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; color: #1A1025; font-weight: bold;">K</span>
              </div>
            </td>
          </tr>
          
          <!-- Content Card -->
          <tr>
            <td style="background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); border-radius: 24px; padding: 40px 32px; border: 1px solid rgba(255,255,255,0.1);">
              <h1 style="margin: 0 0 16px; color: #FFFFFF; font-size: 24px; font-weight: 600; text-align: center;">
                ${c.greeting}
              </h1>
              <p style="margin: 0 0 32px; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; text-align: center;">
                ${c.message}
              </p>
              
              <!-- Verification Code -->
              <div style="background: linear-gradient(135deg, #E8B4D8 0%, #9B7BB8 100%); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #1A1025; font-size: 14px; font-weight: 500;">
                  ${c.codeLabel}
                </p>
                <p style="margin: 0; color: #1A1025; font-size: 36px; font-weight: 700; letter-spacing: 8px;">
                  ${code}
                </p>
              </div>
              
              <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px; text-align: center;">
                ${c.expires}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px; line-height: 1.5;">
                ${c.footer}
              </p>
              <p style="margin: 16px 0 0; color: rgba(255,255,255,0.3); font-size: 11px;">
                © ${new Date().getFullYear()} Kezi. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getVerificationEmailText(code: string, userName: string, language: string): string {
  const content: Record<string, string> = {
    en: `Hi ${userName},\n\nWelcome to Kezi! Your verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't create a Kezi account, you can safely ignore this email.\n\n- The Kezi Team`,
    fr: `Bonjour ${userName},\n\nBienvenue sur Kezi! Votre code de vérification est: ${code}\n\nCe code expire dans 15 minutes.\n\nSi vous n'avez pas créé de compte Kezi, vous pouvez ignorer cet email.\n\n- L'équipe Kezi`,
    rw: `Muraho ${userName},\n\nMurakaza neza kuri Kezi! Kode yawe yo kwemeza ni: ${code}\n\nIyi kode izashira mu minota 15.\n\nNiba utaremye konti ya Kezi, urashobora kwirengagiza iyi email.\n\n- Itsinda rya Kezi`
  };
  return content[language] || content.en;
}

function getPasswordResetEmailTemplate(code: string, userName: string, language: string): string {
  const content: Record<string, { greeting: string; message: string; codeLabel: string; expires: string; footer: string }> = {
    en: {
      greeting: `Hi ${userName},`,
      message: 'We received a request to reset your Kezi password. Enter this code in the app to create a new password:',
      codeLabel: 'Your reset code:',
      expires: 'This code expires in 15 minutes.',
      footer: 'If you didn\'t request a password reset, you can safely ignore this email. Your password won\'t be changed.'
    },
    fr: {
      greeting: `Bonjour ${userName},`,
      message: 'Nous avons reçu une demande de réinitialisation de votre mot de passe Kezi. Entrez ce code dans l\'application pour créer un nouveau mot de passe:',
      codeLabel: 'Votre code de réinitialisation:',
      expires: 'Ce code expire dans 15 minutes.',
      footer: 'Si vous n\'avez pas demandé de réinitialisation, vous pouvez ignorer cet email. Votre mot de passe ne sera pas modifié.'
    },
    rw: {
      greeting: `Muraho ${userName},`,
      message: 'Twabonye icyifuzo cyo guhindura ijambo ryibanga ryawe rya Kezi. Shyiramo iyi kode muri porogaramu kugirango ureme ijambo ryibanga rishya:',
      codeLabel: 'Kode yawe yo guhindura:',
      expires: 'Iyi kode izashira mu minota 15.',
      footer: 'Niba utasabye guhindura ijambo ryibanga, urashobora kwirengagiza iyi email. Ijambo ryibanga ryawe ntabwo rizahinduka.'
    }
  };

  const c = content[language] || content.en;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Kezi Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1A1025;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #E8B4D8 0%, #9B7BB8 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; color: #1A1025; font-weight: bold;">K</span>
              </div>
            </td>
          </tr>
          
          <!-- Content Card -->
          <tr>
            <td style="background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); border-radius: 24px; padding: 40px 32px; border: 1px solid rgba(255,255,255,0.1);">
              <h1 style="margin: 0 0 16px; color: #FFFFFF; font-size: 24px; font-weight: 600; text-align: center;">
                ${c.greeting}
              </h1>
              <p style="margin: 0 0 32px; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; text-align: center;">
                ${c.message}
              </p>
              
              <!-- Reset Code -->
              <div style="background: linear-gradient(135deg, #E8B4D8 0%, #9B7BB8 100%); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #1A1025; font-size: 14px; font-weight: 500;">
                  ${c.codeLabel}
                </p>
                <p style="margin: 0; color: #1A1025; font-size: 36px; font-weight: 700; letter-spacing: 8px;">
                  ${code}
                </p>
              </div>
              
              <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px; text-align: center;">
                ${c.expires}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px; line-height: 1.5;">
                ${c.footer}
              </p>
              <p style="margin: 16px 0 0; color: rgba(255,255,255,0.3); font-size: 11px;">
                © ${new Date().getFullYear()} Kezi. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getPasswordResetEmailText(code: string, userName: string, language: string): string {
  const content: Record<string, string> = {
    en: `Hi ${userName},\n\nWe received a request to reset your Kezi password.\n\nYour reset code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\n- The Kezi Team`,
    fr: `Bonjour ${userName},\n\nNous avons reçu une demande de réinitialisation de votre mot de passe Kezi.\n\nVotre code de réinitialisation est: ${code}\n\nCe code expire dans 15 minutes.\n\nSi vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email.\n\n- L'équipe Kezi`,
    rw: `Muraho ${userName},\n\nTwabonye icyifuzo cyo guhindura ijambo ryibanga ryawe rya Kezi.\n\nKode yawe yo guhindura ni: ${code}\n\nIyi kode izashira mu minota 15.\n\nNiba utasabye guhindura ijambo ryibanga, urashobora kwirengagiza iyi email.\n\n- Itsinda rya Kezi`
  };
  return content[language] || content.en;
}
