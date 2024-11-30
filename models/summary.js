module.exports = (sequelize, DataTypes) => {
    const Summary = sequelize.define('Summary', {
        aiId: { // Renamed to aiId
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Ais', // Links to Ai model
                key: 'id',
            },
        },
        AIresponse: {
            type: DataTypes.BLOB('long'),
            allowNull: false,
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    });

    return Summary;
};