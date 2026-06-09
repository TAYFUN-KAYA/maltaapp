require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

async function createAdmin() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@maltstart.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.ADMIN_NAME || 'MaltaStart Admin';

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.emailVerified = true;
    existing.name = name;
    if (password) existing.password = password;
    await existing.save();
    console.log(`Admin güncellendi: ${email}`);
  } else {
    await User.create({
      email,
      password,
      name,
      role: 'admin',
      emailVerified: true,
    });
    console.log(`Admin oluşturuldu: ${email}`);
  }

  console.log(`Şifre: ${password}`);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
