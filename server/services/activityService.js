const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity event
 * @param {Object} data - Activity log data
 * @param {string} data.userId - User who performed the action
 * @param {string} data.action - Action performed (e.g., 'user.created')
 * @param {string} data.resource - Resource type (e.g., 'user', 'project')
 * @param {string} [data.resourceId] - ID of the affected resource
 * @param {Object} [data.details] - Additional details
 * @param {string} [data.ip] - IP address
 * @param {string} [data.userAgent] - User agent string
 */
const log = async (data) => {
    try {
        await ActivityLog.create(data);
    } catch (error) {
        console.error('Activity log error:', error.message);
    }
};

module.exports = { log };
