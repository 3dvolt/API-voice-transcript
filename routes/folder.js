const express = require('express');
const db = require('../models');
const authenticateToken = require('../middleware/auth'); // Middleware for token authentication

const router = express.Router();

// Create a Folder
router.post('/folders', authenticateToken, async (req, res) => {
    const { name, sharingTable } = req.body;
    const userId = req.user.id;

    if (!userId || !name) {
        return res.status(400).json({ message: 'User ID and folder name are required' });
    }

    try {
        const folder = await db.Folder.create({
            userId,
            name,
            sharingTable
        });

        res.status(201).json({ message: 'Folder created successfully', folder });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ message: 'Failed to create folder', error: error.message });
    }
});

// Get all Folders for a User
router.get('/folders', authenticateToken, async (req, res) => {
    try {
        const folders = await db.Folder.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(folders);
    } catch (error) {
        console.error('Error retrieving folders:', error);
        res.status(500).json({ message: 'Failed to retrieve folders', error: error.message });
    }
});

// Get a Specific Folder by ID
router.get('/folders/:id', authenticateToken, async (req, res) => {
    try {
        const folder = await db.Folder.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        res.status(200).json(folder);
    } catch (error) {
        console.error('Error retrieving folder:', error);
        res.status(500).json({ message: 'Failed to retrieve folder', error: error.message });
    }
});

// Update a Folder
router.put('/folders/:id', authenticateToken, async (req, res) => {
    try {
        const { name, sharingTable } = req.body;
        const folder = await db.Folder.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        await folder.update({ name, sharingTable });

        res.status(200).json({ message: 'Folder updated successfully', folder });
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ message: 'Failed to update folder', error: error.message });
    }
});

// Delete a Folder
router.delete('/folders/:id', authenticateToken, async (req, res) => {
    try {
        const folder = await db.Folder.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        await folder.destroy();
        res.status(200).json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ message: 'Failed to delete folder', error: error.message });
    }
});

module.exports = router;
