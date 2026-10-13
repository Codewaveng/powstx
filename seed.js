require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');
const POW = require('./models/POW');
const Badge = require('./models/Badge');

async function seed() {
  if (process.env.ALLOW_USER_RESET !== 'YES') {
    throw new Error('Reset blocked. Set ALLOW_USER_RESET=YES to confirm you intend to delete all user data.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Reset blocked in production. Use a development database only.');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing.');
  }

  const connection = mongoose.createConnection(process.env.MONGODB_URI);
  try {
    await connection.asPromise();
    const dbName = connection.name;
    const isRemote = /mongodb(?:\+srv)?:\/\//i.test(process.env.MONGODB_URI) && /mongodb\.net/i.test(process.env.MONGODB_URI);

    if (process.env.CONFIRM_DATABASE !== dbName) {
      throw new Error(`Reset blocked. Set CONFIRM_DATABASE=${dbName} to confirm the target database.`);
    }
    if (isRemote && process.env.ALLOW_REMOTE_USER_RESET !== 'YES') {
      throw new Error('Reset blocked for remote MongoDB. Set ALLOW_REMOTE_USER_RESET=YES only if this remote development database is the intended target.');
    }

    const models = [
      connection.model('User', User.schema),
      connection.model('POW', POW.schema),
      connection.model('Badge', Badge.schema)
    ];
    const [users, pows, badges] = await Promise.all(models.map(model => model.countDocuments()));

    await Promise.all(models.map(model => model.deleteMany({})));
    console.log(`Cleared ${users} users, ${pows} projects, and ${badges} badges from database "${dbName}".`);
  } finally {
    await connection.close();
  }
}

seed().catch(error => {
  console.error(`Seed reset failed: ${error.message}`);
  process.exitCode = 1;
});
