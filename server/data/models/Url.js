const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Url = sequelize.define("Url", {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastUpdated: DataTypes.DATE,
    changesTotal: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastDetectedMethod: DataTypes.STRING
  });

  return Url;
};