const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true },
    avatar: String,
    phone: String,
    role: { type: String, enum: ['user', 'admin', 'support'], default: 'user' },
    userType: {
      type: String,
      enum: ['language_student', 'tourist', 'work_study'],
      default: 'tourist',
    },
    language: { type: String, default: 'tr' },
    country: String,
    city: String,
    pushToken: String,
    emailVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLatitude: Number,
    lastLongitude: Number,
    favorites: {
      schools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'School' }],
      tours: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }],
      beaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beach' }],
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
