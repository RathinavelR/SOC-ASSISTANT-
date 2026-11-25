const { Notification } = require('../models');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ read: false });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ read: false }, { read: true });
    } else {
      await Notification.findByIdAndUpdate(id, { read: true });
    }

    res.json({
      success: true,
      message: 'Notification(s) marked as read',
    });
  } catch (error) {
    next(error);
  }
};
