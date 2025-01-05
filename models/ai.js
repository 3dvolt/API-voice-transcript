module.exports = (sequelize, DataTypes) => {
    const Ai = sequelize.define('Ai', {
        transcriptionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Transcriptions',
                key: 'id',
            },
        },
        AIresponse: {
            type: DataTypes.BLOB('long'),
            allowNull: false,
        }
    });

    return Ai;
};
