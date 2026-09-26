const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    cliToken: { type: String, unique: true } // Used for CLI authentication
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
