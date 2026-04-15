export default (sequelize, DataTypes) => {
  const CartItem = sequelize.define(
    'CartItem',
    {
      productId: {
        type: DataTypes.STRING(36),
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      deliveryOptionId: {
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
      tableName: 'carts',
      underscored: true
    }
  );

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    CartItem.belongsTo(models.DeliveryOption, { foreignKey: 'deliveryOptionId', as: 'deliveryOption' });
  };

  return CartItem;
};
