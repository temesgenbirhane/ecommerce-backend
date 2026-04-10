export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      rating: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          stars: 0,
          count: 0
        }
      },
      priceCents: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      keywords: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      }
    },
    {
      tableName: 'products',
      underscored: true
    }
  );

  Product.associate = (models) => {
    Product.hasMany(models.OrderItem, { foreignKey: 'productId', as: 'orderItems' });
  };

  return Product;
};
