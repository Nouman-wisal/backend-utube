import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(cookieParser())

app.use(express.static('public'))

app.use(express.json({limit:'16kb'}))
app.use(urlencoded({extended:true, limit:'16kb'}))

///************************************************* */
// import router
import UserRouter from './routes/user.route.js';

// routes declaration 
app.use("/api/v1/user",UserRouter)





export {app}
