import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";



const registerUser = asyncHandler(async (res, req) => {
    res.status(200).json({
        message: "Okay!!"
    })
})



export { registerUser }