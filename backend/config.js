import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Make.com Webhooks
  makeWebhooks: {
    directory: process.env.MAKE_WEBHOOK_DIRECTORY || 'https://hook.us1.make.com/gleyxf83giw4xqr7i6i94mb7syclmh2o',
    services: process.env.MAKE_WEBHOOK_SERVICES || 'https://hook.us1.make.com/YOUR_SERVICES_WEBHOOK',
    reservations: process.env.MAKE_WEBHOOK_RESERVATIONS || 'https://hook.us1.make.com/YOUR_RESERVATIONS_WEBHOOK',
    payments: process.env.MAKE_WEBHOOK_PAYMENTS || 'https://hook.us1.make.com/YOUR_PAYMENTS_WEBHOOK',
    chatbot: process.env.MAKE_WEBHOOK_CHATBOT || 'https://hook.us1.make.com/YOUR_CHATBOT_WEBHOOK',
    taxis: process.env.MAKE_WEBHOOK_TAXIS || 'https://hook.us1.make.com/YOUR_TAXIS_WEBHOOK',
    users: process.env.MAKE_WEBHOOK_USERS || 'https://hook.us1.make.com/YOUR_USERS_WEBHOOK'
  },
  
  // Hedera Blockchain
  hedera: {
    accountId: process.env.HEDERA_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PRIVATE_KEY,
    network: process.env.HEDERA_NETWORK || 'testnet'
  },
  
  // JWT Secret
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
