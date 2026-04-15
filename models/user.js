export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE(3)
      },
      updatedAt: {
        type: DataTypes.DATE(3)
      }
    },
    {
      tableName: 'users',
      underscored: true
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Order, { foreignKey: 'userId', as: 'orders' });
  };

  return User;
};
