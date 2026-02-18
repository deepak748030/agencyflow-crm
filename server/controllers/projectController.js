const Project = require('../models/Project');
const activityService = require('../services/activityService');

// GET /api/projects
const listProjects = async (req, res) => {
    try {
        const { status, priority, search, page = 1, limit = 50 } = req.query;
        const filter = {};
        const user = req.user;

        if (user.role === 'client') filter.clientId = user._id;
        else if (user.role === 'manager') filter.managerId = user._id;
        else if (user.role === 'developer') filter.developerIds = user._id;

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Project.countDocuments(filter);
        const projects = await Project.find(filter)
            .populate('clientId', 'name email company')
            .populate('managerId', 'name email')
            .populate('developerIds', 'name email')
            .populate('createdBy', 'name')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            response: {
                projects,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        console.error('Fetch projects error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch projects' });
    }
};

// POST /api/projects
const createProject = async (req, res) => {
    try {
        const { name, description, clientId, managerId, developerIds, budget, deadline, priority, tags } = req.body;
        if (!name || !clientId) {
            return res.status(400).json({ success: false, message: 'Name and client are required' });
        }

        const project = new Project({
            name, description, clientId, managerId,
            developerIds: developerIds || [],
            budget: budget || { amount: 0, currency: 'INR', paid: 0, pending: 0 },
            deadline, priority: priority || 'medium',
            tags: tags || [],
            createdBy: req.user._id,
        });

        if (project.budget.amount) {
            project.budget.pending = project.budget.amount - project.budget.paid;
        }

        await project.save();
        await project.populate(['clientId', 'managerId', 'developerIds', 'createdBy']);

        await activityService.log({
            userId: req.user._id,
            action: 'project.created',
            resource: 'project',
            resourceId: project._id,
            details: { name: project.name },
            ip: req.ip,
        });

        res.status(201).json({ success: true, response: project });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ success: false, message: 'Failed to create project' });
    }
};

// GET /api/projects/:id
const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('clientId', 'name email company phone')
            .populate('managerId', 'name email')
            .populate('developerIds', 'name email designation')
            .populate('createdBy', 'name');

        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        res.json({ success: true, response: project });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch project' });
    }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const { name, description, managerId, developerIds, budget, deadline, priority, tags } = req.body;
        if (name) project.name = name;
        if (description !== undefined) project.description = description;
        if (managerId !== undefined) project.managerId = managerId;
        if (developerIds) project.developerIds = developerIds;
        if (budget) project.budget = { ...project.budget.toObject(), ...budget };
        if (deadline !== undefined) project.deadline = deadline;
        if (priority) project.priority = priority;
        if (tags) project.tags = tags;

        await project.save();
        await project.populate(['clientId', 'managerId', 'developerIds']);

        res.json({ success: true, response: project });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update project' });
    }
};

// PATCH /api/projects/:id/status
const updateProjectStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['draft', 'active', 'on_hold', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const oldStatus = project.status;
        project.status = status;
        await project.save();

        await activityService.log({
            userId: req.user._id,
            action: 'project.status_changed',
            resource: 'project',
            resourceId: project._id,
            details: { oldStatus, newStatus: status, projectName: project.name },
            ip: req.ip,
        });

        res.json({ success: true, response: project });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

module.exports = { listProjects, createProject, getProject, updateProject, updateProjectStatus };
