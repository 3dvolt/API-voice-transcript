const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();
const serviceAccount = require('../certificate/niuteq-919af-firebase-adminsdk-jgksy-4aca2102a3.json')

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://niuteq-919af-default-rtdb.europe-west1.firebasedatabase.app"
});

async function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }

    try {
        // Verify the Firebase Auth token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user information to the request
        req.user = {
            id: decodedToken.uid,
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
