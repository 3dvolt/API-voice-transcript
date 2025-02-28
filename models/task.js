module.exports = (sequelize, DataTypes) => {
    const Task = sequelize.define('Task', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        seconds: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        transcriptionId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        completed:{
            type: DataTypes.BOOLEAN,
            allowNull:true,
            defaultValue:false
        }
    });

    return Task;
};
