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

module.exports = db;
