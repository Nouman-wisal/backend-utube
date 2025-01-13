import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import ApiResponce from "../utils/ApiResponse.js";

const registerUser= asyncHandler( async (req,res)=>{
   // 1 get user details from front-end using postman
   // 2 apply validation i.e check if not empty
   // 3 check if user already exist through username and or email.
   // 4 uploaded/check for images path ,uploaded / "check" for avatars path
   // 5 upload them to cloudinary,check avatar in cloudinary
   // 6 create user object(which will have all the details) -create entry in db 
   // 7 remove password and refresh tokens fields from response
   // 8 check for user creation
   // 9 return res


   //1) get details
   const {userName,fullName,email,password}= req.body // data is extracted from here
   //console.log(`email is :: ${email} &  password is ${password}`);
    //console.log(req.body);
//********************************************************************************** */

   //2)validate, check if fields are not empty
    if ([userName,fullName,email,password].some((fields)=>fields?.trim() === "")) {
        throw new ApiError(400,"all fields are required");
    }

    //    if (userName === "") { //you can either apply "if" on all values/fields OR ...
    //     throw new ApiError(400,"All fields are required");
    //    }

//********************************************************************************** */

    //3)  checking if user already exists in db
    const existedUser= await User.findOne({ $or:[{userName},{email}] })

    if (existedUser) {
        throw new ApiError(409,"user with same email or userName already exists")
    }

//********************************************************************************** */

    //4) avatarLocalPath and coverImageLocalPath are fetching the file paths of the uploaded files from the req.files object.
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath= req.files?.coverImage[0]?.path; 
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0) {
        coverImageLocalPath= req.files.coverImage[0].path
    }
    // console.log(req.files);

    if (!avatarLocalPath) {   //checking if avatar is uploaded to local server bcz it's must
     throw new ApiError(409,"avatar field is required")   
    }

//********************************************************************************** */

//5) upload them to cloudinary for url
const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverImage= await uploadOnCloudinary(coverImageLocalPath)
// console.log("aaaaaavvvvvvvvvvvvvaaaaa",avatar);

if (!avatar) {
    throw new ApiError(409,"avatar field is required")
}

//********************************************************************************** */

// 6) create user object and entry in db & remove password ,refreshTokens
 const user= await User.create({
    userName,
    fullName:fullName.toLowerCase(),
    email,
    password,
    avatar:avatar.url,
    coverImage:coverImage?.url || ""

})
// You’ve created a new user in the database earlier in your program (via User.create()), and now you're checking if that user was successfully saved and can be retrieved from the database.

    const createdUser=await User.findById(user._id).select("-password -refreshTokens")

    if (!createdUser) {
        throw new ApiError(500,"something went wrong while registring user")
    }

//********************************************************************************** */

    //9) return res
    return res.status(201).json(
        new ApiResponce(200,createdUser,"user is registered successfully")
    )

})

export {registerUser};