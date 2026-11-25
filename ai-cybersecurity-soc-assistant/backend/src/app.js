const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow Swagger UI and dev frontends
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Wazuh-Integration-Secret'],
  credentials: true,
}));

// Rate Limiting (Protects API against brute force and DDoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', apiLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Swagger / OpenAPI Specification
const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'AI Powered Cybersecurity SOC Assistant API',
    version: '1.0.0',
    description: 'Enterprise Security Operations Center API with Wazuh Integration, AI Threat Analysis, and Automated Incident Correlation.',
  },
  servers: [{ url: '/api', description: 'Local API Server' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Root and Health Endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'AI Powered Cybersecurity SOC Assistant API',
    version: '1.0.0',
    status: 'online',
    docs: '/api/docs',
    health: '/api/health',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Mount Central API Routes
app.use('/api', routes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Central Error Handling Middleware
app.use(errorHandler);

module.exports = app;
