import { Router } from "express";
import { loginUser, logoutUser, refreshAcceessToken, registerUser,changePassword, getCurrentUser, changeDetails, changeAvatar, changeCoverImage, getChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

/*1 */ 
router.route("/register").post(
  upload.fields([
    // the middleware
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser // the controller
);

/*2 */ 
router.route("/login").post(loginUser);

// SECURED ROUTES

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-accessTokens").post(refreshAcceessToken)
router.route("/change-password").post(verifyJWT,changePassword) //Use POST when an action involves extra steps (like security checks in changePassword).

router.route("/get-currentUser").get(verifyJWT,getCurrentUser)

router.route("/change-details").patch(verifyJWT,changeDetails)
router.route("/change-avatar").patch(verifyJWT,upload.single("avatar"),changeAvatar)
router.route("/change-coverImage").patch(verifyJWT,upload.single("coverImage"),changeCoverImage)

router.route("/channel/:userName").get(verifyJWT,getChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)


export default router;
