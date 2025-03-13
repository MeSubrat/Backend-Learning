import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js ";
import {upload} from "../middlewares/multer.middleware.js"
import { loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middelware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar", //frontend field name must be same to this name as "avatar"
            maxCount:1
        },  
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)


//Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)


export default router