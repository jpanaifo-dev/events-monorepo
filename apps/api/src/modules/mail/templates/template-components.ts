/**
 * Reusable HTML Email Template Components
 * Designed for maximum compatibility across email clients (Gmail, Apple Mail, Outlook).
 */

export interface EmailLayoutProps {
  title: string;
  previewText?: string;
  content: string;
  brandName?: string;
  brandUrl?: string;
  accentColor?: string;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main shell layout wrapping email content in a card with branding and footer
 */
export function renderEmailLayout(props: EmailLayoutProps): string {
  const brandName = props.brandName || process.env.APP_NAME || 'Events Platform';
  const brandUrl = props.brandUrl || process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';
  const accentColor = props.accentColor || '#4f46e5';
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(props.title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    div[style*="margin: 16px 0"] {
      margin: 0 !important;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
      border: 0;
    }
    a {
      text-decoration: none;
    }
    .button-link:hover {
      background-color: #4338ca !important;
    }
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: auto !important;
        padding: 10px !important;
      }
      .card-body {
        padding: 24px 18px !important;
      }
      .heading-title {
        font-size: 20px !important;
      }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f5f9;">
  ${props.previewText ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">${escapeHtml(props.previewText)}</div>` : ''}
  
  <center style="width: 100%; background-color: #f1f5f9; padding: 32px 0;">
    <!--[if mso | IE]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width: 600px;">
    <tr>
    <td>
    <![endif]-->
    
    <div style="max-width: 600px; margin: 0 auto;" class="email-container">
      
      <!-- Brand Header -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
        <tr>
          <td align="center" style="padding: 10px 0;">
            <a href="${escapeHtml(brandUrl)}" target="_blank" style="display: inline-flex; align-items: center; text-decoration: none;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, ${accentColor} 0%, #312e81 100%); border-radius: 10px; width: 36px; height: 36px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 18px;">
                    ✦
                  </td>
                  <td style="padding-left: 12px; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">
                    ${escapeHtml(brandName)}
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
      </table>

      <!-- Main Card -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
        <!-- Top Accent Strip -->
        <tr>
          <td height="4" style="background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899); font-size: 0; line-height: 0;">&nbsp;</td>
        </tr>
        <tr>
          <td class="card-body" style="padding: 36px 32px; color: #334155; font-size: 15px; line-height: 1.6;">
            ${props.content}
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td align="center" style="padding: 12px 24px; color: #64748b; font-size: 12px; line-height: 1.5;">
            <p style="margin: 0 0 8px 0; color: #94a3b8;">
              Este es un correo automático enviado por <strong>${escapeHtml(brandName)}</strong>. Por favor, no respondas directamente a este mensaje.
            </p>
            <p style="margin: 0; color: #cbd5e1;">
              &copy; ${year} ${escapeHtml(brandName)}. Todos los derechos reservados.
            </p>
          </td>
        </tr>
      </table>

    </div>

    <!--[if mso | IE]>
    </td>
    </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>`;
}

/**
 * Action button (CTA)
 */
export function renderButton(text: string, url: string, color = '#4f46e5'): string {
  return `
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(url)}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="18%" strokecolor="${color}" fillcolor="${color}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${escapeHtml(text)}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${escapeHtml(url)}" target="_blank" class="button-link" style="background-color: ${color}; color: #ffffff; display: inline-block; font-size: 15px; font-weight: 600; line-height: 46px; text-align: center; text-decoration: none; width: auto; min-width: 200px; padding: 0 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); border: 1px solid ${color};">
          ${escapeHtml(text)} &rarr;
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

/**
 * Highlight / Credentials Card
 */
export function renderInfoCard(title: string, items: Array<{ label: string; value: string; isCode?: boolean }>): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 38%; vertical-align: middle;">
        ${escapeHtml(item.label)}:
      </td>
      <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; vertical-align: middle;">
        ${
          item.isCode
            ? `<span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; color: #0f172a; font-size: 13px; letter-spacing: 0.5px;">${escapeHtml(item.value)}</span>`
            : escapeHtml(item.value)
        }
      </td>
    </tr>`
    )
    .join('');

  return `
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 24px 0;">
    ${title ? `<div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 12px;">${escapeHtml(title)}</div>` : ''}
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
  </div>`;
}

/**
 * Alert / Warning box
 */
export function renderAlert(text: string, type: 'info' | 'warning' | 'security' = 'info'): string {
  const styles = {
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: 'ℹ️' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '⚠️' },
    security: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '🛡️' },
  }[type];

  return `
  <div style="background-color: ${styles.bg}; border-left: 4px solid ${styles.border}; border-radius: 6px; padding: 14px 16px; margin: 20px 0; color: ${styles.text}; font-size: 13px; line-height: 1.5;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width: 24px; vertical-align: top; font-size: 15px; padding-right: 8px;">${styles.icon}</td>
        <td style="color: ${styles.text}; font-size: 13px; line-height: 1.5;">${escapeHtml(text)}</td>
      </tr>
    </table>
  </div>`;
}

/**
 * Role or Status Badge
 */
export function renderBadge(text: string, variant: 'primary' | 'success' | 'warning' | 'purple' = 'primary'): string {
  const styles = {
    primary: 'background-color: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe;',
    success: 'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;',
    warning: 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;',
    purple: 'background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff;',
  }[variant];

  return `<span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; ${styles}">${escapeHtml(text)}</span>`;
}
