// Professional HTML email template for supplier price-submission invitations.
// Plain inline CSS is used so every major email client (Gmail, Outlook, Apple Mail) renders consistently.

export function buildSupplierEmail({ name, submissionUrl, brandName = 'GaiaSpeak Protocol' }) {
  const safeName = escapeHtml(name || 'Supplier');
  const safeUrl = escapeAttr(submissionUrl);
  const year = new Date().getFullYear();

  const subject = `${brandName} · Submit your current gold & silver prices`;

  const text = [
    `Hello ${safeName},`,
    '',
    `${brandName} would like your latest physical gold and silver prices (per kilogram).`,
    'Please use the secure link below to submit your quotation. It should take less than a minute.',
    '',
    submissionUrl,
    '',
    'If the link above is not clickable, copy and paste it into your browser.',
    '',
    'Thank you for partnering with us.',
    `— The ${brandName} Team`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;">
      ${brandName} needs your latest gold and silver prices per kilogram.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="color:#ffffff;font-size:20px;font-weight:600;letter-spacing:0.5px;">
                      ${brandName}
                    </td>
                    <td align="right" style="color:#fbbf24;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">
                      Supplier Portal
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:600;color:#0f172a;line-height:1.35;">
                  Hello ${safeName},
                </h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">
                  You've been invited to submit your current <strong>physical gold and silver prices</strong>
                  (per kilogram) to the ${brandName} supplier directory.
                </p>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;">
                  Our oracle automatically selects the best-priced verified supplier each time a 1&nbsp;kg
                  batch closes. Keeping your quote up to date ensures you remain competitive for upcoming orders.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 32px 32px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="border-radius:8px;background-color:#0f172a;">
                      <a href="${safeUrl}"
                         style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                        Submit Prices
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;">
                  The link is unique to your account and should not be shared.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <div style="padding:16px 18px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                  <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">
                    Direct link
                  </p>
                  <p style="margin:0;font-size:12px;line-height:1.5;color:#2563eb;word-break:break-all;">
                    ${safeUrl}
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
                  Thank you for partnering with us.<br />
                  <span style="color:#6b7280;">— The ${brandName} Team</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">
                  You received this email because your company is listed in the ${brandName} supplier directory.<br />
                  © ${year} ${brandName}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

