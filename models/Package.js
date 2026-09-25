const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, index: true },
    version: { type: String, required: true },
    description: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true }, // The .tgz filename
    downloads: { type: Number, default: 0 },
    readme: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Package', PackageSchema);
