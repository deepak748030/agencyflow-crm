const express = require('express');
const { auth, roleGuard } = require('../middleware/auth');
const projectController = require('../controllers/projectController');
const router = express.Router();

router.get('/', auth, projectController.listProjects);
router.post('/', auth, roleGuard(['admin']), projectController.createProject);
router.get('/:id', auth, projectController.getProject);
router.put('/:id', auth, roleGuard(['admin', 'manager']), projectController.updateProject);
router.patch('/:id/status', auth, roleGuard(['admin', 'manager']), projectController.updateProjectStatus);

module.exports = router;
