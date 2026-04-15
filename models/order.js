export default (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true
      },
      orderTimeMs: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      totalCostCents: {
        type: DataTypes.INTEGER,
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
      tableName: 'orders',
      underscored: true
    }
  );

  Order.associate = (models) => {
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'products' });
  };

  return Order;
};
