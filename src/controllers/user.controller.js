import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
    /*Steps for registering a user:) 
    - Get user details from frontend(e.g using react or postman),✅
    - Validation(e.g check empty fields),✅
    - Check if user alraedy exists:  [check using username, email] ✅
    - Check for images, check for avatar✅
    - Upload them to cloudinary, ✅
    - Also check in cloudinary that avatar is received or not,✅
    - Create user object - create entry in DB,✅
    - Remove password and refresh token field from response,✅
    - Check for user creation✅
    - Return res✅
    */

    //User Details receiving from frontend
    const { fullName, email, username, password } = req.body
    console.log("email: ", email)

    // if(fullName==="")
    // {
    //     throw new ApiError(400, "Full name is required ")
    // } // Manual check all the fields and it will be lengthy..

    //Another method will be this below for validation: 
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //Check for existing user!!
    const existingUser = User.findOne({ //Here we can also use User.find()
        $or: [{ username }, { email }]
    })
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //Check for avatar as well as coverImage
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    //Upload On cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    //Check this avatar is present or not in the db else it may cause crash in the db
    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    //User Creation
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        username:username.toLowerCase()
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //This fields are not required that's why '-' symbol is used there
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user!")
    }

    return response.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )

})

export { registerUser }