import mongoose, { mongo } from 'mongoose';
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log('connected to mongodb!')
    } catch (error) {
        console.log('error connecting to mongodb');
        console.log(error)
    }
}

export { connectDB }