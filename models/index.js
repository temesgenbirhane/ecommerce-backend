import { Sequelize, DataTypes } from 'sequelize';
import defineUser from './user.js';
import defineProduct from './product.js';
import defineOrder from './order.js';
import defineOrderItem from './orderItem.js';
import defineDeliveryOption from './deliveryOption.js';
import defineCart from './CartItem.js';

const dbType = (process.env.DB_TYPE || '').toLowerCase();
const dbName = process.env.RDS_DB_NAME || process.env.DB_NAME;
const dbUser = process.env.RDS_USERNAME || process.env.DB_USERNAME;
const dbPassword = process.env.RDS_PASSWORD || process.env.DB_PASSWORD;
const dbHost = process.env.RDS_HOSTNAME || process.env.DB_HOST;
const dbPort = process.env.RDS_PORT || process.env.DB_PORT;

const hasNetworkDbConfig = Boolean(dbHost && dbName && dbUser && dbPassword);
const networkDialect = dbType === 'mysql' ? 'mysql' : dbType === 'postgres' || dbType === 'postgresql' ? 'postgres' : null;
const defaultPortByDialect = {
  mysql: 3306,
  postgres: 5432
};
const defaultNetworkPort = networkDialect ? defaultPortByDialect[networkDialect] : undefined;

const networkConfig = {
  host: dbHost,
  port: dbPort ? Number(dbPort) : defaultNetworkPort,
  dialect: networkDialect,
  logging: false
};

const sequelize = hasNetworkDbConfig && networkDialect
  ? new Sequelize(dbName, dbUser, dbPassword, networkConfig)
  : new Sequelize({
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
