const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('monitoring_app', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});

module.exports = sequelize;