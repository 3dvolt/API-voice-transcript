module.exports = (sequelize, DataTypes) => {
    const Pdf = sequelize.define('Pdf', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        folderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },{
        timestamps: true
    });

    return Pdf;
};
