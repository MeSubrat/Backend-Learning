import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) //Save the refresh token into the DB without again validating the fields
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Seomething went wrong while generating refresh and access token!!")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    /*Steps for registering a user:) 
    - Get user details from frontend(e.g using react or postman),✅
    - Validation(e.g check empty fields),✅
    - Check if user already exists:  [check using username, email] ✅
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
    // console.log("email: ", email)

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
    const existingUser = await User.findOne({ //Here we can also use User.find()
        $or: [{ username }, { email }]
    })
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files)

    //Check for avatar as well as coverImage
    const avatarLocalPath = req.files?.avatar[0]?.path || null;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; //This is giving undefined error if we are not sending any coverImage.

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    coverImageLocalPath = req.files?.coverImage?.[0]?.path || null; //If there is no coverimage then it will there to protect from craching.

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
        username: username.toLowerCase(),
        email
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //This fields are not required that's why '-' symbol is used there
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    //Extract data from req.body
    //Give acces via username or email
    //Find the email
    //If user registered successfully then check check password.
    // Then generate access and refresh token
    //Then send it by secure cookies
    //Then send response login successful.


    const { email, username, password } = req.body
    if (!username && !email) {
        throw new ApiError(400, "username or email is required.")
    }

    const user = await User.findOne({   //For this user the refresh token field is empty, cause we have called the generateAccessAndRefreshToken() below.
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist!!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials!!")
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggInUser = await User.findById(user._id).select("-password -refreshToken")

    //Options for cookies
    const options = {
        httpOnly: true, //With the help of this it can only be modified by the server and can't be modified by the frontend.
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggInUser, accessToken, refreshToken
                    //Here we are again returning this acees and refresh token for any extrenal usage like in case the developer developing a mobile application in that case cookies can't be save. So externally we have to pass thise.
                },
                "User logged in suceesfully!"
            )
        )


})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }


    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefrehToken = req.cookies.refreshToken /*Request coming from frontend*/ || req.body.refreshToken //(req coming from mobiles)
    if (!incomingRefrehToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefrehToken,
            process.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefrehToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is invalid or expired")
        }

        //generate new access and refresh token 
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        const options = {
            httpOnly: true,
            secured: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password!!")
    }
    user.password = newPassword
    user.save({ validateBeforeSave: true })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "Current user fetched successfully!")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true } //This means it will return updated user
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details are updated successfully!"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading the avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.body?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-passowrd")

    res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successFully"))
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing!")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading the avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.body?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-passowrd")

    res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successFully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}