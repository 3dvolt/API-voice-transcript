module.exports = (sequelize, DataTypes) => {
    const Referral = sequelize.define('Referral', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        referralCode: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        usageLimit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 4
        },
        claimedCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    });

    return Referral;
};
