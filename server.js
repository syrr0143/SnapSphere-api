import dotenv from 'dotenv';
import { connectDB } from './db/connection.js'
import { app } from './app.js'
dotenv.config();

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`app is running on port ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log("connection to mongo failed");
    })