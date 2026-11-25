const Joi = require('joi');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    req[property] = value;
    next();
  };
};

// Auth schemas
const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  role: Joi.string().valid('ADMIN', 'SOC_ANALYST', 'VIEWER').default('VIEWER'),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

// Alert schemas
const updateAlertSchema = Joi.object({
  status: Joi.string().valid('NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'),
});

// Incident schemas
const createIncidentSchema = Joi.object({
  title: Joi.string().required().max(200),
  description: Joi.string().max(5000),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  relatedAlerts: Joi.array().items(Joi.string()),
  affectedAgents: Joi.array().items(Joi.object({
    agentId: Joi.string(),
    agentName: Joi.string(),
    agentIp: Joi.string(),
  })),
  sourceIps: Joi.array().items(Joi.string()),
  assignedTo: Joi.string().allow(null, ''),
});

const updateIncidentSchema = Joi.object({
  title: Joi.string().max(200),
  description: Joi.string().max(5000),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
  status: Joi.string().valid('OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'),
  assignedTo: Joi.string().allow(null, ''),
  resolution: Joi.string().max(5000),
});

const addCommentSchema = Joi.object({
  text: Joi.string().required().max(2000),
});

// Query schemas
const alertQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
  status: Joi.string().valid('NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'),
  agentId: Joi.string(),
  ruleId: Joi.string(),
  sourceIp: Joi.string(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  search: Joi.string().max(200),
  sort: Joi.string().default('-timestamp'),
  mitreTechnique: Joi.string(),
});

const incidentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
  status: Joi.string().valid('OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'),
  assignedTo: Joi.string(),
  search: Joi.string().max(200),
  sort: Joi.string().default('-createdAt'),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateAlertSchema,
  createIncidentSchema,
  updateIncidentSchema,
  addCommentSchema,
  alertQuerySchema,
  incidentQuerySchema,
};
