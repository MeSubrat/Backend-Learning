import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true //It is better to enable index as true cause it will help more for searching purposes.
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //Cloudinary URL 
        required:true,
    },
    coverImage:{
        type:String //cloudinary Url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

userSchema.pre("save",async function(next){ 
/*Here "pre" is a middleware which is used to call some functions just before some task like here we want call our function just before saving the user into the db. Here we have'nt used arrow function cause arrow functions do not have reference of current context i.e this.
Again here we have used an async function cause it will take time.
*/  
    //Here  "isModified()" is provided by mongoose.
    if(!this.isModified("password")) return next()
    //We introduced this code cause when we update any field in the db it will encrypt the password. If we update username then also it will encrypt the password.

    this.password=await bcrypt.hash(this.password, 10) //Here 10 is th number of rounds for hashing.
    next()
})

//CUSTOM METHODS
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email: this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User=mongoose.model("User",userSchema)