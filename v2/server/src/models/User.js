const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    },
    online: { type: Boolean, default: false },
    last_seen: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Method to check password
userSchema.methods.matchPassword = async function (originalPassword) {
    return await bcrypt.compare(originalPassword, this.password);
};

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
