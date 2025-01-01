// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`SERVER CONNECTED AT PORT : ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log(`server failed to connect with db ${error}`);
    });
  })
  .catch((error) => {
    console.log("mongo db connection failed !!", error);
  });















  
// import mongoose from "mongoose";
// import express from 'express';
// import { DB_NAME } from "./constansts";

// const app=express()

// (async()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on("error",(error)=>{
//             console.log('ERRR',error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`APP IS LISTENING ON PORT ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.error('ERROR',error);
//         throw error
//     }
// })()
