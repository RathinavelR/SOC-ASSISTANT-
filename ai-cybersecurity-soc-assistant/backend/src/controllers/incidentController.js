const { Incident, Alert } = require('../models');
const notificationService = require('../services/notifications/notificationService');
const { logAction } = require('../utils/auditLogger');

exports.getIncidents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      severity,
      status,
      assignedTo,
      search,
      sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (search) {
      filter.$or = [
        { incidentId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('relatedAlerts', 'wazuhAlertId ruleDescription ruleLevel severity timestamp agentName'),
      Incident.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        incidents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createIncident = async (req, res, next) => {
  try {
    const { title, description, severity, relatedAlerts, affectedAgents, sourceIps, assignedTo } = req.body;

    const incident = new Incident({
      title,
      description,
      severity,
      relatedAlerts: relatedAlerts || [],
      affectedAgents: affectedAgents || [],
      sourceIps: sourceIps || [],
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      timeline: [
        {
          action: 'Incident Created Manually',
          description: `Created by ${req.user.firstName} ${req.user.lastName}`,
          user: req.user._id,
          automated: false,
        },
      ],
    });

    await incident.save();

    // Link alerts back to this incident
    if (relatedAlerts && relatedAlerts.length > 0) {
      await Alert.updateMany(
        { _id: { $in: relatedAlerts } },
        { incidentId: incident._id }
      );
    }

    await logAction({
      req,
      user: req.user,
      action: 'INCIDENT_CREATED',
      category: 'incident',
      description: `Incident ${incident.incidentId} created: "${incident.title}"`,
    });

    await notificationService.notifyIncident(incident);

    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

exports.getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName email')
      .populate('timeline.user', 'firstName lastName email')
      .populate('relatedAlerts')
      .populate('threatIntelResults');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateIncident = async (req, res, next) => {
  try {
    const { title, description, severity, status, assignedTo, resolution } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const changes = [];

    if (title && title !== incident.title) {
      incident.title = title;
      changes.push(`Title updated to "${title}"`);
    }

    if (description !== undefined) incident.description = description;

    if (severity && severity !== incident.severity) {
      changes.push(`Severity changed from ${incident.severity} to ${severity}`);
      incident.severity = severity;
    }

    if (status && status !== incident.status) {
      changes.push(`Status changed from ${incident.status} to ${status}`);
      incident.status = status;

      if (status === 'RESOLVED' || status === 'CLOSED') {
        incident.resolvedAt = new Date();
        incident.resolvedBy = req.user._id;
        if (resolution) incident.resolution = resolution;
      }
    }

    if (assignedTo !== undefined && assignedTo !== incident.assignedTo?.toString()) {
      incident.assignedTo = assignedTo || null;
      changes.push(`Assigned analyst updated`);
    }

    if (changes.length > 0) {
      incident.timeline.push({
        action: 'Incident Updated',
        description: changes.join('; '),
        user: req.user._id,
        automated: false,
      });
    }

    await incident.save();

    await logAction({
      req,
      user: req.user,
      action: 'INCIDENT_UPDATED',
      category: 'incident',
      description: `Incident ${incident.incidentId} updated: ${changes.join(', ')}`,
    });

    res.json({
      success: true,
      message: 'Incident updated successfully',
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    incident.comments.push({
      text,
      user: req.user._id,
      createdAt: new Date(),
    });

    incident.timeline.push({
      action: 'Comment Added',
      description: `${req.user.firstName} ${req.user.lastName} added a note/comment`,
      user: req.user._id,
      automated: false,
    });

    await incident.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: incident.comments,
    });
  } catch (error) {
    next(error);
  }
};
