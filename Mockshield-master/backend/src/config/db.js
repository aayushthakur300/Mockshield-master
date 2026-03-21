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
// neon database 
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 60000
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Neon PostgreSQL Connected Successfully.');
    
    // 🔥 NUCLEAR OPTION: THIS COMMAND DELETES THE CORRUPTED TABLE AND REBUILDS IT 🔥
    await sequelize.sync({ force: true }); 
    console.log('✅ Database Schema FORCE Synced & Rebuilt.');
    
  } catch (error) {
    console.error('❌ Unable to connect to Neon PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };