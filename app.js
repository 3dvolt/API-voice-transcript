const express = require('express');
const { sequelize } = require('./models');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import and use routes
const uploadRoute = require('./routes/upload');
const authRoute = require('./routes/auth');
const timerRoute = require('./routes/timer');
app.use('/v1/api', uploadRoute);
app.use('/api/auth', authRoute);
app.use('/v1/api', timerRoute);

// Sync database models and start server
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
    console.log('Database synchronized');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Unable to connect to database:', err);
});
