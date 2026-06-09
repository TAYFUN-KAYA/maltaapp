require('dotenv').config();
const connectDB = require('../config/db');
const School = require('../models/School');
const { SCHOOL_CITIES, normalizeSchoolCity } = require('../utils/schoolCity');

async function fixSchoolCities() {
  await connectDB();
  const schools = await School.find({});
  let fixed = 0;

  for (const school of schools) {
    const next = normalizeSchoolCity(school.city);
    if (school.city !== next) {
      school.city = next;
      await school.save();
      fixed += 1;
      console.log(`- ${school.name}: "${school.city}" → ${next}`);
    }
  }

  const invalid = await School.countDocuments({ city: { $nin: SCHOOL_CITIES } });
  console.log(`Düzeltilen okul: ${fixed}, kalan geçersiz: ${invalid}`);
  process.exit(invalid ? 1 : 0);
}

fixSchoolCities().catch((err) => {
  console.error(err);
  process.exit(1);
});
