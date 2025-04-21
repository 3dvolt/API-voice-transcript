const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.RDS_DB_NAME || 'database_name_2',
    process.env.RDS_USERNAME || 'postgres',
    process.env.RDS_PASSWORD || 'mysecretpassword',
    {
            host: process.env.RDS_HOSTNAME || 'localhost',
            dialect: 'postgres',
            protocol: 'postgres',
            logging: false,
            dialectOptions: process.env.SSL_DB === 'true' ? {
                    ssl: { require: true, rejectUnauthorized: false }
            } : {},
            port: process.env.RDS_PORT || 5432,
    }
);

const db = {};

// Dynamically import all models in the models folder
fs.readdirSync(__dirname)
    .filter(file => file !== 'index.js' && file.endsWith('.js'))
    .forEach(file => {
            const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
            db[model.name] = model;
    });

// Setup associations if any
Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
                db[modelName].associate(db);
        }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// A Transcription can have only one Ai
db.Transcription.hasOne(db.Ai, { foreignKey: 'transcriptionId', as: 'AiDetails' });

// An Ai must belong to one Transcription
db.Ai.belongsTo(db.Transcription, { foreignKey: 'transcriptionId', as: 'Transcription' });

// An Ai can have only one Summary
db.Ai.hasOne(db.Summary, { foreignKey: 'aiId', as: 'AiSummary' });

// A Summary must belong to one Ai
db.Summary.belongsTo(db.Ai, { foreignKey: 'aiId', as: 'Ai' });

db.Task.belongsTo(db.Transcription, {foreignKey: 'transcriptionId', as: 'taskTranscriptionId',constraints: false});

db.Folder.hasMany(db.Transcription, {foreignKey: 'folderID', as: 'transcriptions'});

db.Transcription.belongsTo(db.Folder, {foreignKey: 'folderID', as: 'folder'});

db.Pdf.belongsTo(db.Folder, {foreignKey: 'folderId', as: 'folder'});

db.Folder.hasMany(db.Pdf, {foreignKey: 'folderId', as: 'pdfs'});

module.exports = db;
