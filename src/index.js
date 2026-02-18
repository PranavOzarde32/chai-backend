//require("dotenv").config({path:"./.env"});
import dotenv from "dotenv";

import mongoose, { connect } from "mongoose";
import {DB_NAME} from "./constants.js"
import connectDB from "./db/index.js";

dotenv.config({path:"./.env"});

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
  })
})
.catch((error)=>{
    console.log("mondodb connection failed :",error);
})


/*
import express from "express";
const app = express();


;(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    
    app.on("error",(error)=>{
        console.log("Error",error);
    })
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    }


  } catch (error) {
    console.error("Error :", error);
  }
})()
  */