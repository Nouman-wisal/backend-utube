import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponce from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(async (req, res) => {
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
  const { userName, fullName, email, password } = req.body; // data is extracted from here
  //console.log(`email is :: ${email} &  password is ${password}`);
  //console.log(req.body);
  //********************************************************************************** */

  //2)validate, check if fields are not empty
  if (
    [userName, fullName, email, password].some((fields) => fields?.trim() === "" )) {
    throw new ApiError(400, "all fields are required");
  }

  //    if (userName === "") { //you can either apply "if" on all values/fields OR ...
  //     throw new ApiError(400,"All fields are required");
  //    }

  //********************************************************************************** */

  //3)  checking if user already exists in db
  const existedUser = await User.findOne({ $or: [{ userName }, { email }] });

  if (existedUser) {
    throw new ApiError(409, "user with same email or userName already exists");
  }

  //********************************************************************************** */

  //4) avatarLocalPath and coverImageLocalPath are fetching the file paths of the uploaded files from the req.files object.
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath= req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // console.log(req.files);

  if (!avatarLocalPath) {
    //checking if avatar is uploaded to local server bcz it's must
    throw new ApiError(409, "avatar field is required");
  }

  //********************************************************************************** */

  //5) upload them to cloudinary for url
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // console.log("aaaaaavvvvvvvvvvvvvaaaaa",avatar);

  if (!avatar) {
    throw new ApiError(409, "avatar field is required");
  }

  //********************************************************************************** */

  // 6) create user object and entry in db & remove password ,refreshTokens
  const user = await User.create({
    userName,
    fullName: fullName.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  // You’ve created a new user in the database earlier in your program (via User.create()), and now you're checking if that user was successfully saved and can be retrieved from the database.

  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registring user");
  }

  //********************************************************************************** */

  //9) return res
  return res
    .status(201)
    .json(new ApiResponce(200, createdUser, "user is registered successfully"));
});

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
//4)
const generateAccessAndRefreshTokens = async (UserId) => {
  try {
    //retrieving the user document/obj for generate access and refresh tokens
    const user = await User.findById(UserId);
    // Generating access and refresh tokens
    const accessTokens = user.generateAccessTokens();
    const refreshTokens = user.generateRefreshTokens();

    // Save the refresh token to the user document in the database
    user.refreshTokens = refreshTokens;
    user.save({ validateBeforeSave: false }); // Save without validating other fields

    return { accessTokens, refreshTokens };

  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh tokens."
    );
  }
};

//////////////////////////////////*********************************///////////////////////////////////////

const loginUser = asyncHandler(async (req, res) => {
  // get details by req.body
  // verify if that user is resgistered in db by their given email or username
  // check/match password through bcrypth
  // generate access and refresh toekns
  // give them through cookies
  //return res

  //1)
  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400,"userName or email is required")
  }
  //******************************************************** */

  //2)
  const user = await User.findOne({ $or: [{ email }, { userName }] });
  //    console.log(user);

  if (!user) {
    throw new ApiError(400, "userName or email is incorrect");
  }

  // ******************************************************** */

  //3)
  const isPasswordValid = await user.isPasswordCorrect(password); // this password field is given by user above.

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid password");
  }

  // ******************************************************** */

  //4) func executed here
  const { accessTokens, refreshTokens } = await generateAccessAndRefreshTokens(user._id);

  // ******************************************************** */

  //5)
  // retreiving the user document again to minus password & refreshTokens to send to front end. it's optional (it increases loading time) bcz you can use the above "user"

  const loggedinUser = await User.findById(user._id).select("-password -refreshTokens");

  //Set options for cookies
  const options = {
    httpOnly: true, // Cookies can't be tampered with by client-side JavaScript
    secure: true, // Cookies are sent only over HTTPS
  };

  //Send response with cookies and user details
  return res
    .status(200)
    .cookie("accessTokens", accessTokens, options)
    .cookie("refreshTokens", refreshTokens, options)
    .json( new ApiResponce(
        201,{ user: loggedinUser, accessTokens, refreshTokens },"user logged in successfuly"
    ));
});


///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const logoutUser= asyncHandler(async (req,res)=>{
    // to logOut you need to remove access and refresh token cookies from user browser. delete refreshTokens from user doc/obj in db . which was stored in user document/obj during login.

    // :give access to user(document/obj) in req which is done through auth

    
    const updatedDoc= await User.findByIdAndUpdate(req.user._id, {$set:{refreshTokens:undefined}},{new:true} )
    //console.log(`updated document / object : ${updatedDoc}`);

    const options={
        httpOnly:true,
        secure:true
    }


    return res
    .status(200)
    .clearCookie("accessTokens",options)
    .clearCookie("refreshTokens",options)
    .json(new ApiResponce(200,{},"user logged out!"))

})

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const refreshAcceessToken= asyncHandler(async(req,res)=>{

  // extract refreshTokens from the req.cookies or head extract,check refreshTokens
  //decode/verify the refresh tokens
  // call the user document through the id in decodedToken
  // compare the refreshTokens from user doc with the extracted tokens for getting new access tokens
  // if error then throw error else generate new tokens
  //return res with cookie filled with both tokens 


  const incomingRefreshTokens=req.cookies?.refreshTokens || req.body.refreshTokens

  if (!incomingRefreshTokens) {
    throw new ApiError(400,"unauthorized tokens")
  }

  //******************************************************** */

 try {
   const decoded= jwt.verify(incomingRefreshTokens,process.env.REFRESH_TOKEN_SECRET)
 
 //******************************************************** */

   const user = await User.findById(decoded._id)
 
   if (!user) {
     throw new ApiError(400,"invalid refresh tokens")
   }
   
   if (incomingRefreshTokens !== user?.refreshTokens) {
     throw new ApiError(400,"refresh tokens expired or used")
    }
    
    
    //******************************************************** */
 
   const {accessTokens,newRefreshTokens}=await generateAccessAndRefreshTokens(user._id)
    console.log(newRefreshTokens);
 
   const options={
     httpOnly: true,
     secure:true
 }
 
   return res
   .status(200)
   .cookie("accessTokens",accessTokens,options)
   .cookie("refreshTokens",newRefreshTokens,options)
   .json(
     new ApiResponce(200,{accessTokens,refreshTokens:newRefreshTokens},"access tokens refreshed")
   )
 } catch (error) {
  
  throw new ApiError(400, error?.message || "invalid refresh tokens")

 }
})


export { registerUser, loginUser,logoutUser,refreshAcceessToken };
