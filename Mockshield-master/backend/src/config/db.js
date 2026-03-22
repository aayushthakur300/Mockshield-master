// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//   dialect: 'postgres',
//   logging: false, // Set to console.log to see raw SQL queries
//   // 👇 ADD THIS BLOCK FOR NEON SSL COMPATIBILITY 👇
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false
//     }
//   }
// });

// const connectDB = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ Neon PostgreSQL Connected Successfully.');
//     await sequelize.sync(); 
//   } catch (error) {
//     console.error('❌ Unable to connect to Neon PostgreSQL:', error);
//     process.exit(1);
//   }
// };

// module.exports = { sequelize, connectDB };
//--------------------------------------------------------------------------------------------
// mogo db 
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ MongoDB Connected Successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };