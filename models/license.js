module.exports = (sequelize, DataTypes) => {
    const License = sequelize.define('License', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        subscriptionName: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Free Tier',
        },
        minuteLimit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 180,
        }
    });

    return License;
};
