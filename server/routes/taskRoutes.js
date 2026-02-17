const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const { auth, roleGuard } = require('../middleware/auth');
const router = express.Router();

// GET /api/tasks - List tasks (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { projectId, status, priority, assignedTo, search, page = 1, limit = 50 } = req.query;
        const filter = {};

        if (projectId) filter.projectId = projectId;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Role-based filtering
        if (req.user.role === 'developer') {
            filter.assignedTo = req.user._id;
        } else if (req.user.role === 'client') {
            const clientProjects = await Project.find({ clientId: req.user._id }).select('_id');
            filter.projectId = { $in: clientProjects.map(p => p._id) };
        }

        const total = await Task.countDocuments(filter);
        const tasks = await Task.find(filter)
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            response: {
                tasks,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        console.error('List tasks error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks - Create task
router.post('/', auth, roleGuard(['admin', 'manager']), async (req, res) => {
    try {
        const { projectId, title, description, assignedTo, deadline, priority } = req.body;
        if (!projectId || !title) {
            return res.status(400).json({ success: false, message: 'Project and title are required' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const task = new Task({
            projectId,
            title,
            description: description || '',
            assignedTo: assignedTo || null,
            assignedBy: req.user._id,
            deadline: deadline || null,
            priority: priority || 'medium',
        });
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name');

        await ActivityLog.create({
            userId: req.user._id,
            action: 'task.created',
            resource: 'task',
            resourceId: task._id,
            details: { title: task.title, projectId },
        });

        res.status(201).json({ success: true, response: populated });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ success: false, message: 'Failed to create task' });
    }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name')
            .populate('comments.userId', 'name avatar');

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        res.json({ success: true, response: task });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch task' });
    }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, roleGuard(['admin', 'manager']), async (req, res) => {
    try {
        const { title, description, assignedTo, deadline, priority, status } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
        if (deadline !== undefined) task.deadline = deadline || null;
        if (priority) task.priority = priority;
        if (status) task.status = status;

        await task.save();

        const populated = await Task.findById(task._id)
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email avatar')
            .populate('assignedBy', 'name');

        await ActivityLog.create({
            userId: req.user._id,
            action: 'task.updated',
            resource: 'task',
            resourceId: task._id,
            details: { title: task.title },
        });

        res.json({ success: true, response: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update task' });
    }
});

// PATCH /api/tasks/:id/status - Update task status (any assigned user)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['todo', 'in_progress', 'review', 'done'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.status = status;
        await task.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: `task.${status}`,
            resource: 'task',
            resourceId: task._id,
            details: { title: task.title, status },
        });

        const populated = await Task.findById(task._id)
            .populate('projectId', 'name')
            .populate('assignedTo', 'name email avatar');

        res.json({ success: true, response: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update task status' });
    }
});

// POST /api/tasks/:id/comments - Add comment
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.comments.push({ userId: req.user._id, text });
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('comments.userId', 'name avatar');

        res.json({ success: true, response: populated.comments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', auth, roleGuard(['admin', 'manager']), async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await ActivityLog.create({
            userId: req.user._id,
            action: 'task.deleted',
            resource: 'task',
            resourceId: task._id,
            details: { title: task.title },
        });

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete task' });
    }
});

module.exports = router;
