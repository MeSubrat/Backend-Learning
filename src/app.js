import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app =express();

// explore different cors settings in the express documentation.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"})) //It will accept only 16kb size limit of json file.
app.use(express.urlencoded())//This is okay but if u want to deep dive and break this into objects then this is the process below.
app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public")) //This is a public folder to store public data like pdfs, imagaes etc.

app.use(cookieParser()) //To perform CRUD operations in cookies in browser.

//routes import 
import userRouter from './routes/user.routes.js'


//routes declaration
app.use("/users",userRouter)

//If we are defining our api then we can write routes for register like this: 
app.use("/api/v1/users",userRouter) //URL: https://localhost:8000/api/v1/users/register
//Here v1: verson of api



// export default app;
export {app}