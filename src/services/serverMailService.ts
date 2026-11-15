export type {
  EmailThreadingOptions,
  SmtpConfig,
  ConsolidatedEmailOptions,
} from './mail/mailTypesAndParsing';
export { parseEmailList } from './mail/mailTypesAndParsing';
export { getEffectiveSmtpConfig, getTransporter } from './mail/smtpConfigAndTransporter';
export { buildThreadedEmailHtml } from './mail/mailHtmlTemplates';
export { sendThreadedEmployeeEmail } from './mail/threadedMailSender';
export { sendConsolidatedReportEmail } from './mail/consolidatedMailSender';
