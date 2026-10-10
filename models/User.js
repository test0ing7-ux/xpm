const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true },
    password: { type: String }, // Hashed password for native auth
    avatarUrl: { type: String },
    cliToken: { type: String, unique: true }, // Used for CLI authentication
    googleId: { type: String, unique: true, sparse: true }, // Made sparse/optional for native auth users
    isVerified: { type: Boolean, default: false }, // Must verify OTP to publish
    otp: { type: String }, // Alphanumeric OTP
    otpExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
