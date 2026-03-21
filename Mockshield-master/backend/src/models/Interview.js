// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');
// const User = require('./User');

// const Interview = sequelize.define('Interview', {
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true
//   },
//   // We store the list of questions/answers as a JSON object in Postgres
//   questions_data: {
//     type: DataTypes.JSONB, 
//     allowNull: false
//   },
//   overall_feedback: {
//     type: DataTypes.TEXT,
//     allowNull: true
//   },
//   total_score: {
//     type: DataTypes.FLOAT,
//     defaultValue: 0.0
//   }
// });

// // Setup Relationship
// User.hasMany(Interview, { foreignKey: 'userId' });
// Interview.belongsTo(User, { foreignKey: 'userId' });

// module.exports = Interview;
//-------------------------------------------------------------------------------
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // 👇 THE NEW TOPIC COLUMN 👇
  topic: {
    type: DataTypes.STRING,
    defaultValue: 'General' // If no topic is sent, it defaults to 'General'
  },
  questions_data: {
    type: DataTypes.JSONB, 
    allowNull: false
  },
  overall_feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  }
});

// Setup Relationship

module.exports = Interview;