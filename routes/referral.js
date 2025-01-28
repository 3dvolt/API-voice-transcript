const express = require('express');
const { Referral, License, User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Generate referral code for a user
router.post('/generate-referral-code', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user already has a referral code
        let referral = await Referral.findOne({ where: { userId } });

        if (!referral) {
            referral = await Referral.create({
                userId,
                referralCode: uuidv4().slice(0, 8).toUpperCase(),
                usageLimit: 4,
                claimedCount: 0
            });
        }

        return res.status(200).json({
            referralCode: referral.referralCode,
            usageLimit: referral.usageLimit,
            claimedCount: referral.claimedCount
        });
    } catch (error) {
        console.error('Error generating referral code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Claim a referral code
router.post('/claim-referral-code', authenticateToken, async (req, res) => {
    try {
        const { referralCode } = req.body;
        const userId = req.user.id;

        const referral = await Referral.findOne({ where: { referralCode } });

        if (!referral) {
            return res.status(404).json({ error: 'Invalid referral code' });
        }

        if (referral.userId === userId) {
            return res.status(400).json({ error: "You can't use your own referral code" });
        }

        if (referral.claimedCount >= referral.usageLimit) {
            return res.status(400).json({ error: 'Referral code usage limit reached' });
        }

        // Add bonus minutes to referrer
        let referrerLicense = await License.findOne({ where: { userId: referral.userId } });
        if (referrerLicense) {
            referrerLicense.minuteLimit += 30;  // Add 30 bonus minutes
            await referrerLicense.save();
        }

        // Mark the referral as claimed
        referral.claimedCount += 1;
        await referral.save();

        return res.status(200).json({
            message: 'Referral code successfully claimed, 30 minutes added to the referrer!',
            claimedCount: referral.claimedCount
        });
    } catch (error) {
        console.error('Error claiming referral code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Check referral code status
router.get('/check-referral/:code', async (req, res) => {
    try {
        const { code } = req.params;

        const referral = await Referral.findOne({ where: { referralCode: code } });

        if (!referral) {
            return res.status(404).json({ error: 'Referral code not found' });
        }

        return res.status(200).json({
            referralCode: referral.referralCode,
            usageLimit: referral.usageLimit,
            claimedCount: referral.claimedCount
        });
    } catch (error) {
        console.error('Error checking referral code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
