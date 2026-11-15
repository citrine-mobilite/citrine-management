import { RESPONSIVE_EMAIL_STYLE_TAG } from './responsiveEmailCss';

export interface OutlookEmailShellOptions {
  title: string;
  maxWidth?: number;
  bodyBg?: string;
  cardBg?: string;
  innerHtml: string;
}

export function buildOutlookHtmlDocument({
  title,
  maxWidth = 640,
  bodyBg = '#f4f4f5',
  cardBg = '#ffffff',
  innerHtml,
}: OutlookEmailShellOptions): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  ${RESPONSIVE_EMAIL_STYLE_TAG}
</head>
<body class="email-wrap-text" style="margin: 0; padding: 0; background-color: ${bodyBg}; font-family: Calibri, 'Segoe UI', Arial, sans-serif; color: #1c1917;" bgcolor="${bodyBg}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${bodyBg}" class="email-outer" style="background-color: ${bodyBg}; width: 100%;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="${maxWidth}">
          <tr>
            <td align="center" valign="top" width="${maxWidth}">
        <![endif]-->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${cardBg}" class="email-card" style="max-width: ${maxWidth}px; width: 100%; background-color: ${cardBg}; border: 1px solid #d6d3d1;">
          ${innerHtml}
        </table>
        <!--[if (gte mso 9)|(IE)]>
            </td>
          </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
