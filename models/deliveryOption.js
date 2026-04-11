export default (sequelize, DataTypes) => {
  const DeliveryOption = sequelize.define(
    'DeliveryOption',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      deliveryDays: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      priceCents: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: 'delivery_options',
      underscored: true
    }
  );

  return DeliveryOption;
};
