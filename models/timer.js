module.exports = (sequelize, DataTypes) => {
    const Timer = sequelize.define('Timer', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
        },
        seconds: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    });

    return Timer;
};
