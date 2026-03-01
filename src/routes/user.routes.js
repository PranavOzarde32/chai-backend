import { Router } from "express";
import { 
    logoutUser,
    loginUser,
    registerUser,
    refreshAccessToken,
    changeCurentPassword,
    getCurentUser,
    updateCurentUser,
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory
 } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)


router.route("/login").post( loginUser )

//secured route - only for logged in users

router.route("/logout").post( verifyJWT, logoutUser )

router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post( verifyJWT, changeCurentPassword  )
router.route("/current-user").get( verifyJWT, getCurentUser  )
router.route("/update-account").patch( verifyJWT, updateCurentUser  )
router.route("/avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar)
router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"), updateUserCoverImage)


router.route("/c/:usernamae").get( verifyJWT,getUserChannelProfile  )
router.route("/history").get( verifyJWT, getWatchHistory  )

router.route("/watch-history").get( verifyJWT, getWatchHistory  )


export default router