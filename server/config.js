// server/config.js
// Centralised configuration for the Node email server.
// Reads from process.env — load dotenv before importing this module.

const config = {
  // Resend
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromOrder: process.env.EMAIL_FROM_ORDER || 'GaiaSpeak <orders@gaiaspeak.io>',
  fromSupplier: process.env.EMAIL_FROM_SUPPLIER || 'GaiaSpeak Protocol <noreply@gaiaspeak.io>',

  // Public site URL (used to build supplier submit links)
  siteUrl: process.env.SITE_URL || 'https://gaiaspeak.io',

  // Server
  port: Number(process.env.EMAIL_SERVER_PORT) || 3001,
};

export default config;
