import mongoose from 'mongoose'

const storiesSchema = new mongoose.Schema({
    user:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    imageurl: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
        required: false
    },
    totalViews:{
        type: Number,
        default: 0
    }


}, { timestamps: true })

export const Story = mongoose.model('Story', storiesSchema);