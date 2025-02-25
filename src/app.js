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


// export default app;
export {app}