import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js'
import postRouter from './routes/posts.routes.js'

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use('/api/v1/user', userRouter)
app.use('/api/v1/post', postRouter)
// app.use('/api/v1/post', postRouter)
export { app };