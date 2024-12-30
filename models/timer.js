module.exports = (sequelize, DataTypes) => {
    const Timer = sequelize.define('Timer', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        seconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    });

    return Timer;
};
