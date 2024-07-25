import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        required: false
    },
    avatar: {
        type: String,
        required: true
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    likedPost: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Like'
    }],
    refreshToken: {
        type: String,
        required: false
    },
    savedPost: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        createdAt: { type: Date, default: Date.now }
    }],
    resetPasswordToken: String,
    resetTokenExpires: Date,


}, { timestamps: true });

// hash the password before the user is saved into the datanase'

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) {
        return next();
    } else {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    }
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function (_id) {
    return jwt.sign({
        _id: this._id,
        email: this.email
    },
        process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })
};

export const User = mongoose.model('User', userSchema);