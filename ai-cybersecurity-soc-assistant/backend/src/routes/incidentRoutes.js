const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validate,
  createIncidentSchema,
  updateIncidentSchema,
  addCommentSchema,
  incidentQuerySchema,
} = require('../middleware/validate');

router.use(authenticate);

router.get('/', validate(incidentQuerySchema, 'query'), incidentController.getIncidents);
router.post('/', authorize('ADMIN', 'SOC_ANALYST'), validate(createIncidentSchema), incidentController.createIncident);
router.get('/:id', incidentController.getIncidentById);
router.patch('/:id', authorize('ADMIN', 'SOC_ANALYST'), validate(updateIncidentSchema), incidentController.updateIncident);
router.post('/:id/comments', authorize('ADMIN', 'SOC_ANALYST'), validate(addCommentSchema), incidentController.addComment);

module.exports = router;
