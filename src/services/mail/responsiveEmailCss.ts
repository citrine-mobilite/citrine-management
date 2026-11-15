export const RESPONSIVE_EMAIL_STYLE_TAG = `<style type="text/css">
  * { box-sizing: border-box; }
  body, table, td, p, a, div { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  table { border-collapse: collapse; }
  img { -ms-interpolation-mode: bicubic; max-width: 100% !important; height: auto !important; border: 0; }
  .email-scroll-x { width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .email-wrap-text { word-break: break-word; overflow-wrap: anywhere; }
  @media only screen and (max-width: 640px) {
    .email-outer { padding: 10px 6px !important; }
    .email-card { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
    .email-pad { padding: 16px 14px !important; }
    .email-pad-sm { padding: 12px 10px !important; }
    .email-stack { display: block !important; width: 100% !important; max-width: 100% !important; }
    .email-stack-left { display: block !important; width: 100% !important; max-width: 100% !important; text-align: left !important; padding-top: 8px !important; }
    .email-kpi-spacer { display: none !important; width: 0 !important; height: 0 !important; }
    .email-kpi-cell { display: block !important; width: 100% !important; max-width: 100% !important; margin-bottom: 8px !important; border-left: none !important; }
    .email-h1 { font-size: 20px !important; line-height: 1.25 !important; }
    .email-btn { display: block !important; width: 100% !important; text-align: center !important; padding: 12px 16px !important; }
    .email-badge-row { text-align: left !important; padding-top: 8px !important; }
    .email-badge-row span { margin: 2px 6px 2px 0 !important; }
    .email-mobile-table th, .email-mobile-table td { padding: 6px 7px !important; font-size: 10.5px !important; }
    .email-kv-label { display: block !important; width: 100% !important; padding-bottom: 2px !important; }
    .email-kv-val { display: block !important; width: 100% !important; padding-top: 0 !important; padding-bottom: 10px !important; text-align: left !important; }
    .email-hide-xs { display: none !important; }
  }
</style>`;
