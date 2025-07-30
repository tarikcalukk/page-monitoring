const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize('monitoring_app', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

const User = require('./User')(sequelize);
const Url = require('./Url')(sequelize);
const MethodMetric = require('./MethodMetric')(sequelize);
const MethodHistory = require('./MethodHistory')(sequelize);

// Relacije
User.hasMany(Url);
Url.belongsTo(User);

Url.hasMany(MethodMetric);
MethodMetric.belongsTo(Url);

MethodMetric.hasMany(MethodHistory);
MethodHistory.belongsTo(MethodMetric);

module.exports = {
  sequelize,
  User,
  Url,
  MethodMetric,
  MethodHistory
};