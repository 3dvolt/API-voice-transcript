const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
app.use(cors())
app.use(express.urlencoded({ extended: true }));

// Import and use routes
const uploadRoute = require('./routes/upload');
const authRoute = require('./routes/auth');
const summaryRoute = require('./routes/summary');
const timerRoute = require('./routes/timer');
const statsRoute = require('./routes/stats');
const goalRoute = require('./routes/goal');
const referralRoute = require('./routes/referral');
const taskRoute = require('./routes/task');
const folderRoute = require('./routes/folder');
const transcriptionRoute = require('./routes/transcription');


app.use('/v1/api', referralRoute);
app.use('/v1/api', uploadRoute);
app.use('/api/auth', authRoute);
app.use('/v1/api', timerRoute);
app.use('/v1/api', summaryRoute);
app.use('/v1/api', statsRoute );
app.use('/v1/api', goalRoute );
app.use('/v1/api', taskRoute );
app.use('/v1/api', folderRoute );
app.use('/v1/api', transcriptionRoute );

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
