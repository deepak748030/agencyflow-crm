const express = require('express');
const { auth, roleGuard } = require('../middleware/auth');
const taskController = require('../controllers/taskController');
const router = express.Router();

router.get('/', auth, taskController.listTasks);
router.post('/', auth, roleGuard(['admin', 'manager']), taskController.createTask);
router.get('/:id', auth, taskController.getTask);
router.put('/:id', auth, roleGuard(['admin', 'manager']), taskController.updateTask);
router.patch('/:id/status', auth, taskController.updateTaskStatus);
router.post('/:id/comments', auth, taskController.addComment);
router.delete('/:id', auth, roleGuard(['admin', 'manager']), taskController.deleteTask);

module.exports = router;
