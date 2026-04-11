import { Sequelize, DataTypes } from 'sequelize';
import defineUser from './user.js';
import defineProduct from './product.js';
import defineOrder from './order.js';
import defineOrderItem from './orderItem.js';
import defineDeliveryOption from './deliveryOption.js';
import defineCart from './CartItem.js';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './ecommerce.sqlite',
  logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;


// This  only registers the model in your backend code. 
// so that sequalize is aware of it. it does not sync the schema or - create tables
db.User = defineUser(sequelize, DataTypes);
db.Product = defineProduct(sequelize, DataTypes);
db.Order = defineOrder(sequelize, DataTypes);
db.OrderItem = defineOrderItem(sequelize, DataTypes);
db.DeliveryOption = defineDeliveryOption(sequelize, DataTypes);
db.CartItem = defineCart(sequelize, DataTypes);

Object.values(db).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(db);
  }
});

export default db;
