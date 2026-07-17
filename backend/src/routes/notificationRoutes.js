const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/email-status', authorize('Admin'), notificationController.emailStatus);

router.get('/config', authorize('Admin'), notificationController.getConfigGlobal);
router.put('/config', authorize('Admin'), notificationController.saveConfigGlobal);
router.post('/broadcast', authorize('Admin'), notificationController.broadcastAviso);
router.post('/sla-check', authorize('Admin'), notificationController.runSlaCheck);

router.get('/preferences', notificationController.getMyNotificationPrefs);
router.put('/preferences', notificationController.saveMyNotificationPrefs);
router.get('/push-status', notificationController.getMyPushStatus);
router.post('/push-token', notificationController.registerPushToken);
router.delete('/push-token', notificationController.unregisterPushToken);

router.get('/', notificationController.listNotifications);
router.put('/read-all', notificationController.markAllNotificationsAsRead);
router.put('/:id/read', notificationController.markNotificationAsRead);

module.exports = router;
