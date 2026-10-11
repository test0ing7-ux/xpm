const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
    version: { type: String, required: true },
    description: { type: String },
    filename: { type: String, required: true },
    gridFsId: { type: mongoose.Schema.Types.ObjectId, required: true },
    size: { type: Number, default: 0 },
    dependencies: { type: mongoose.Schema.Types.Mixed, default: {} },
    readme: { type: String },
    fileTree: [{ type: String }] // Keep for historical zip/tarball inspection if needed
}, { timestamps: true });

const PackageSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true,
        match: [/^[a-z0-9-]+$/, 'Package name can only contain lowercase letters, numbers, and dashes.']
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: String },
    tarballSize: { type: Number, default: 0 },
    maintainers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    versions: [VersionSchema],
    
    distTags: {
        type: Map,
        of: String,
        default: { latest: '1.0.0' }
    },

    downloads: { type: Number, default: 0 },
    readme: { type: String }
}, { timestamps: true });

PackageSchema.methods.getLatestVersion = function() {
    if (!this.versions || this.versions.length === 0) return null;
    const latestSemver = this.distTags.get('latest');
    if (!latestSemver) return this.versions[this.versions.length - 1];
    return this.versions.find(v => v.version === latestSemver) || this.versions[this.versions.length - 1];
};

module.exports = mongoose.model('Package', PackageSchema);
