const router = require('express').Router();
const mobileSyncController = require('../controllers/mobileSyncController');

router.get('/status', mobileSyncController.getStatus);

module.exports = router;
