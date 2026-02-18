const User = require('../models/User');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const ActivityLog = require('../models/ActivityLog');

// GET /api/dashboard/analytics
const getAnalytics = async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user.role === 'admin';

        // Build project filter based on role
        const projectFilter = {};
        if (user.role === 'client') projectFilter.clientId = user._id;
        else if (user.role === 'manager') projectFilter.managerId = user._id;
        else if (user.role === 'developer') projectFilter.developerIds = user._id;

        const totalUsers = isAdmin ? await User.countDocuments({ isActive: true }) : 0;
        const usersByRole = isAdmin ? (await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ])) : [];

        const totalProjects = await Project.countDocuments(projectFilter);
        const projectsByStatus = await Project.aggregate([
            { $match: projectFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const activeProjects = await Project.countDocuments({ ...projectFilter, status: 'active' });

        // Get project IDs for milestone filtering
        const userProjects = isAdmin ? [] : await Project.find(projectFilter).select('_id');
        const userProjectIds = userProjects.map(p => p._id);
        const milestoneFilter = isAdmin ? {} : { projectId: { $in: userProjectIds } };

        const revenueData = await Milestone.aggregate([
            { $match: { ...milestoneFilter, status: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
        ]);
        const pendingPayments = await Milestone.aggregate([
            { $match: { ...milestoneFilter, status: 'payment_pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const activityFilter = isAdmin ? {} : { userId: user._id };
        const recentActivity = await ActivityLog.find(activityFilter)
            .populate('userId', 'name avatar role')
            .sort({ createdAt: -1 })
            .limit(10);

        const recentProjects = await Project.find(projectFilter)
            .populate('clientId', 'name company')
            .populate('managerId', 'name')
            .sort({ updatedAt: -1 })
            .limit(5);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyRevenue = await Milestone.aggregate([
            { $match: { ...milestoneFilter, status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({
            success: true,
            response: {
                stats: {
                    totalUsers,
                    totalProjects,
                    activeProjects,
                    totalRevenue: revenueData[0]?.totalRevenue || 0,
                    pendingPayments: pendingPayments[0]?.total || 0,
                },
                usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
                projectsByStatus: projectsByStatus.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
                recentActivity,
                recentProjects,
                monthlyRevenue,
            },
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};

module.exports = { getAnalytics };
