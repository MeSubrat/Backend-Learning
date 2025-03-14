import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middelware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar", //frontend field name must be same to this name as "avatar"
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)


//Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)


export default router