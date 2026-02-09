// ============================
// DATABASE MIGRATION SCRIPT
// ============================
// Run this script to add the status column to existing database
// Usage: node backend/migrate.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Sequelize, DataTypes } = require('sequelize');

function hasAllEnv(keys) {
  return keys.every(k => process.env[k] && process.env[k].trim());
}

const useSQLite =
  process.env.DB_TYPE === 'sqlite' ||
  !hasAllEnv(['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST']);

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'database.sqlite');

const sequelize = useSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: console.log
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: console.log,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    );

const Client = sequelize.define('Client', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  service: DataTypes.STRING,
  message: DataTypes.TEXT,
  status: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    defaultValue: 'pending'
  }
});

async function migrate() {
  try {
    console.log('🔄 Starting migration...');
    
    // Use alter to add new columns without dropping existing data
    await sequelize.sync({ alter: true });
    
    // Update any null status values to 'pending'
    await sequelize.query(
      `UPDATE "Clients" SET status = 'pending' WHERE status IS NULL OR status = ''`
    );
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Status column added to Clients table');
    console.log('✅ All existing records set to "pending" status');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
