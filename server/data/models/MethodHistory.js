const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MethodHistory = sequelize.define("MethodHistory", {
    time: DataTypes.DATE,
    timeMs: DataTypes.FLOAT,
    cpu: DataTypes.FLOAT,
    memoryMb: DataTypes.FLOAT,
    hash: DataTypes.STRING, // samo za HASH
    elementCount: DataTypes.INTEGER, // samo za DOM
    maxDepth: DataTypes.INTEGER,
    attributeCount: DataTypes.INTEGER
  });

  return MethodHistory;
};