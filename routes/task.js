const express = require('express');
const db = require('../models');
const authenticateToken = require('../middleware/auth'); // Middleware for token authentication

const router = express.Router();

router.post('/tasks', authenticateToken, async (req, res) => {
    const { name, seconds, transcriptionId } = req.body;
    const userId = req.user.id;

    if (!userId || !name || !transcriptionId) {
        return res.status(400).json({ message: 'User ID, name, and transcriptionId are required' });
    }

    try {
        const task = await db.Task.create({
            userId,
            name,
            seconds,
            transcriptionId,
        });

        res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Failed to create task', error: error.message });
    }
});

// Get all Tasks
router.get('/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await db.Task.findAll({
            where: { userId: req.user.id },
            include: [{ model: db.Transcription, as: 'taskTranscriptionId' ,attributes: ['nota', 'status']}],
        });

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error retrieving tasks:', error);
        res.status(500).json({ message: 'Failed to retrieve tasks', error: error.message });
    }
});

// Get all Tasks by Transcription
router.get('/tasks/:transcriptionID', authenticateToken, async (req, res) => {
    try {
        const tasks = await db.Task.findAll({
            where: {
                userId: req.user.id,
                transcriptionId: req.params.transcriptionId
            }
        });

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error retrieving tasks:', error);
        res.status(500).json({ message: 'Failed to retrieve tasks', error: error.message });
    }
});

// Update a Task
router.put('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { name, seconds, transcriptionId } = req.body;
        const task = await db.Task.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.update({ name, seconds, transcriptionId });

        res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Failed to update task', error: error.message });
    }
});

// Delete a Task
router.delete('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const task = await db.Task.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.destroy();
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Failed to delete task', error: error.message });
    }
});

// Mark a Task as Completed
router.patch('/tasks/:id/complete', authenticateToken, async (req, res) => {
    try {
        const task = await db.Task.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }

        await task.update({ completed: true });

        res.status(200).json({ message: 'Task marked as completed', task });
    } catch (error) {
        console.error('Error marking task as completed:', error);
        res.status(500).json({ message: 'Failed to mark task as completed', error: error.message });
    }
});

// Get Task Summary by User (Count + Completed, Grouped by Date)
router.get('/tasks/summary', authenticateToken, async (req, res) => {
    try {
        const tasks = await db.Task.findAll({
            where: { userId: req.user.id },
            attributes: [
                [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalTasks'],
                [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN completed = true THEN 1 ELSE 0 END')), 'completedTasks'],
            ],
            group: ['date'],
            order: [['date', 'ASC']],
        });

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error retrieving task summary:', error);
        res.status(500).json({ message: 'Failed to retrieve task summary', error: error.message });
    }
});

module.exports = router;
