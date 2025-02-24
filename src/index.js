/* require('doenvt').config({path: './env'}) //It will break our code's consistency */
import dotenv from "dotenv"
// import connectDB from "./db";//This statement will give us error.
import connectDB from "./db/index.js";



dotenv.config({
    path:'./env'
})

connectDB()





//FIRST APPROACH
/*import express from "express"; 
const app=express();
//IIFE function
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR: ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.loadEnvFile.PORT}`)
        })
    }catch(error){
        console.log("Error:",error)
    }
})()
*/
