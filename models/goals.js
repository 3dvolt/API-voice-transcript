module.exports = (sequelize, DataTypes) => {
    const Goal = sequelize.define('Goal', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        FocusGoals: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        RememberGoals: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    });

    return Goal;
};