
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

//This middleware is used to verify a user's access token and ensure they are authenticated before allowing them to access protected routes.


// extract token from req.cookies or the header,check token
// decode/verify token using jwt
// Access user doc/obj using _id inside decoded token
// add user to request for logout controller to do it's thing.

const verifyJWT= asyncHandler(async(req,_,next)=>{
try {
    
        //1) Extract the token from cookies or the Authorization header
       const token= req.cookies?.accessTokens || req.header("Authorization")?.replace("Bearer ","")
        console.log(token);

       if (!token) { // If no token is found, throw an error
        throw new ApiError(401,"unauthorized request!!!")
       }
    
       //2) Verify the token using the secret key
       const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
       //3)Find the user doc/obj in the database using the _id from the decoded token
       const user= await User.findById(decodedToken?._id).select("-refreshTokens -password")
    
       if (!user) {
        throw new ApiError(401,"invalid access tokens")
       }
    
       //4)Attach the user object to the request object
       req.user=user
    
       next()

} catch (error) {
    throw new ApiError(401, error?.message || "invalid access tokens")
}

})

export default verifyJWT;