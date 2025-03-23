const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();
const serviceAccount = require('../certificate/niuteq-919af-firebase-adminsdk-jgksy-4aca2102a3.json')
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://niuteq-919af-default-rtdb.europe-west1.firebasedatabase.app"
});

const GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000;

async function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }

    try {

        let decodedToken = jwt.decode(token);

        if (!decodedToken || !decodedToken.exp) {
            return res.status(403).json({ message: 'Invalid token format' });
        }

        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
            const expiredTime = decodedToken.exp * 1000; // Convert to milliseconds
            if (Date.now() - expiredTime > GRACE_PERIOD) {
                return res.status(403).json({ message: 'Token expired beyond the grace period' });
            }
            console.warn('Token expired but within grace period, allowing access.');
        } else {
            // Verify the token with Firebase if it's still valid
            decodedToken = await admin.auth().verifyIdToken(token).catch(() => null);
            if (!decodedToken) {
                return res.status(403).json({ message: 'Invalid token' });
            }
        }

        // Attach user information to the request
        req.user = {
            id: decodedToken.user_id,
            email: decodedToken.email,
            name: decodedToken.name || 'Unknown User', // Name is optional in Firebase tokens
        };

        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error('Token verification failed:', err);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

module.exports = authenticateToken;
