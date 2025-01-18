import { Router } from "express";
import { loginUser, logoutUser, refreshAcceessToken, registerUser } from "../controllers/user.controller.js";
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


export default router;
