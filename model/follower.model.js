import mongoose from 'mongoose'

const followerSchema = new mongoose.Schema({
    followed_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    following_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

export const Follower = mongoose.model('Follower', followerSchema);