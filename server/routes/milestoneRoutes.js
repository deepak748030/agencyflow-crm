const express = require('express');
const { auth, roleGuard } = require('../middleware/auth');
const milestoneController = require('../controllers/milestoneController');
const router = express.Router();

router.post('/', auth, roleGuard(['admin', 'manager']), milestoneController.createMilestone);
router.get('/project/:projectId', auth, milestoneController.getProjectMilestones);
router.patch('/:id/status', auth, roleGuard(['admin', 'manager', 'developer']), milestoneController.updateMilestoneStatus);
router.put('/:id', auth, roleGuard(['admin']), milestoneController.editMilestone);
router.delete('/:id', auth, roleGuard(['admin']), milestoneController.deleteMilestone);
router.post('/:id/create-order', auth, milestoneController.createRazorpayOrder);
router.post('/:id/verify-payment', auth, milestoneController.verifyPayment);
router.post('/:id/send-reminder', auth, roleGuard(['admin', 'manager']), milestoneController.sendReminder);
router.get('/:id/invoice', auth, milestoneController.downloadInvoice);

module.exports = router;
