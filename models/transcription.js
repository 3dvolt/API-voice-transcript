module.exports = (sequelize, DataTypes) => {
    const Transcription = sequelize.define('Transcription', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
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
