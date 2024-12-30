module.exports = (sequelize, DataTypes) => {
    const APILog = sequelize.define('APILog', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        endpoint: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });

    return APILog;
};
