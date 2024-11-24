module.exports = (sequelize, DataTypes) => {
    const APILog = sequelize.define('APILog', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
        },
        endpoint: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });

    return APILog;
};
