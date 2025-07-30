const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MethodMetric = sequelize.define("MethodMetric", {
    method: {
      type: DataTypes.ENUM("HASH", "DOM"),
      allowNull: false
    },
    avgTimeMs: DataTypes.FLOAT,
    avgCpu: DataTypes.FLOAT,
    avgMemoryMb: DataTypes.FLOAT,
    totalTimeMs: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalCpu: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalMemoryMb: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  });

  return MethodMetric;
};