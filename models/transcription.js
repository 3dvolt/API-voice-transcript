module.exports = (sequelize, DataTypes) => {
    const Transcription = sequelize.define('Transcription', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        nota: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        favourite: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        tag: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'uploaded',
        },
        loadtype: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        wav: {
            type: DataTypes.BLOB('long'),
            allowNull: false,
        }
    });

    return Transcription;
};
