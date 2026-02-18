const express = require('express');
const { auth, roleGuard } = require('../middleware/auth');
const milestoneController = require('../controllers/milestoneController');
const router = express.Router();

router.post('/', auth, roleGuard(['admin', 'manager']), milestoneController.createMilestone);
router.get('/project/:projectId', auth, milestoneController.getProjectMilestones);
router.patch('/:id/status', auth, milestoneController.updateMilestoneStatus);

module.exports = router;
