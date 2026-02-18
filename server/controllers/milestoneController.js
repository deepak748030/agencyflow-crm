const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const activityService = require('../services/activityService');

// POST /api/milestones
const createMilestone = async (req, res) => {
    try {
        const { projectId, title, description, amount, dueDate } = req.body;
        if (!projectId || !title || !amount) {
            return res.status(400).json({ success: false, message: 'Project, title, and amount are required' });
        }

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const milestone = new Milestone({
            projectId, title, description, amount, dueDate,
            createdBy: req.user._id,
        });
        await milestone.save();

        await activityService.log({
            userId: req.user._id,
            action: 'milestone.created',
            resource: 'milestone',
            resourceId: milestone._id,
            details: { title, amount, projectName: project.name },
            ip: req.ip,
        });

        res.status(201).json({ success: true, response: milestone });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create milestone' });
    }
};

// GET /api/milestones/project/:projectId
const getProjectMilestones = async (req, res) => {
    try {
        const milestones = await Milestone.find({ projectId: req.params.projectId })
            .populate('createdBy', 'name')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, response: milestones });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch milestones' });
    }
};

// PATCH /api/milestones/:id/status
const updateMilestoneStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

        const validTransitions = {
            pending: ['in_progress'],
            in_progress: ['submitted'],
            submitted: ['client_approved', 'in_progress'],
            client_approved: ['payment_pending'],
            payment_pending: ['paid'],
        };

        if (!validTransitions[milestone.status]?.includes(status)) {
            return res.status(400).json({ success: false, message: `Cannot transition from ${milestone.status} to ${status}` });
        }

        milestone.status = status;
        if (status === 'client_approved') {
            milestone.approvedBy = req.user._id;
            milestone.approvedAt = new Date();
        }
        if (status === 'paid') {
            milestone.paidAt = new Date();
            milestone.paidBy = 'manual';
            const project = await Project.findById(milestone.projectId);
            if (project) {
                project.budget.paid = (project.budget.paid || 0) + milestone.amount;
                project.budget.pending = project.budget.amount - project.budget.paid;
                await project.save();
            }
        }

        await milestone.save();

        await activityService.log({
            userId: req.user._id,
            action: `milestone.${status}`,
            resource: 'milestone',
            resourceId: milestone._id,
            details: { title: milestone.title, status },
            ip: req.ip,
        });

        res.json({ success: true, response: milestone });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update milestone' });
    }
};

module.exports = { createMilestone, getProjectMilestones, updateMilestoneStatus };
