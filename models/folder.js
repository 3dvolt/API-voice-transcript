module.exports = (sequelize, DataTypes) => {
    const Folder = sequelize.define('Folder', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sharingTable: {
            type: DataTypes.JSON,
            allowNull: true,
        }
    });

    return Folder;
};
