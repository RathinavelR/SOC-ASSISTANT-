require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/soc-assistant',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  wazuh: {
    mode: process.env.WAZUH_MODE || 'self-hosted',
    apiUrl: process.env.WAZUH_API_URL || 'https://localhost:55000',
    username: process.env.WAZUH_API_USERNAME || '',
    password: process.env.WAZUH_API_PASSWORD || '',
    verifySsl: process.env.WAZUH_VERIFY_SSL === 'true',
    integrationSecret: process.env.WAZUH_INTEGRATION_SECRET || '',
    pollInterval: parseInt(process.env.WAZUH_POLL_INTERVAL, 10) || 30000,
  },

  threatIntel: {
    virusTotalKey: process.env.VIRUSTOTAL_API_KEY || '',
    abuseIpDbKey: process.env.ABUSEIPDB_API_KEY || '',
    shodanKey: process.env.SHODAN_API_KEY || '',
  },

  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  demoMode: process.env.DEMO_MODE === 'true',

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};

module.exports = config;
