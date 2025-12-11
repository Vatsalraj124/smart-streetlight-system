import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  constructor() {
    this._connect();
  }

  _connect() {
    const dbOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Add auth if using authenticated connection
    if (process.env.MONGODB_URI.includes('@')) {
      dbOptions.authSource = 'admin';
    }

    mongoose.connect(process.env.MONGODB_URI, dbOptions)
      .then(() => {
        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        
        // Monitor connection events
        this._monitorConnection();
      })
      .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(() => this._connect(), 5000);
      });
  }

  _monitorConnection() {
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  async healthCheck() {
    try {
      // Try to run a simple command
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        collections: (await mongoose.connection.db.listCollections().toArray()).map(c => c.name)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const database = new Database();
export default database;