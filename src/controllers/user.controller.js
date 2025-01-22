import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponce from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import deleteFromCloudinary from "../utils/del_cloudinary.js";

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
  if (req.files &&Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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
    avatar:{
     url:avatar.url,
     public_id: avatar.public_id
    },
    coverImage: {
      url:coverImage?.url || "",
      public_id:coverImage?.public_id || ""

    }
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
 
   const {accessTokens,refreshTokens}=await generateAccessAndRefreshTokens(user._id)
    console.log(refreshTokens);
 
   const options={
     httpOnly: true,
     secure:true
 }
 
   return res
   .status(200)
   .cookie("accessTokens",accessTokens,options)
   .cookie("refreshTokens",refreshTokens,options)
   .json(
     new ApiResponce(200,{accessTokens,refreshTokens},"access tokens refreshed")
   )
 } catch (error) {
  
  throw new ApiError(400, error?.message || "invalid refresh tokens")

 }
})

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////


const changePassword=asyncHandler(async(req,res)=>{

  // take the new and old password info from req.body
  // use the method from user model to comapre the passwords
  // querry the data base for user document/object with req.user._id using auth middleware
  // change the password,then save the user document in db
  // return res with status code and message
  

  const {oldPassword,newPassword}=req.body



  const user= await User.findById(req.user._id)

  const checkingValidity= await user.isPasswordCorrect(oldPassword)

  if (!checkingValidity) {
  throw new ApiError(400,"Invalid old password")
  }
  ////***********************************************////////

  user.password=newPassword

  await user.save({validateBeforeSave:false})
  
  return res
  .status(200)
  .json(new ApiResponce(200,{},"password changed successfully!!!"))

})

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const getCurrentUser=asyncHandler(async(req,res)=>{
  // to get current user details you have to be logged in 
  // get user document use auth(verifyJWT) req.user._id
  //return res with the req.user._id 
  return res
  .status(200)
  .json(new ApiResponce(200,req.user,"User fetched successfully"))

})

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const changeDetails=asyncHandler(async(req,res)=>{

  // take the details from req.body
  // check the details
  // use middleware to get user doc by findByIdAndUpdate and update it
  // return res -password


  const {fullName,email}=req.body

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required")
  }

  ////***********************************************////////


  const user=await User.findByIdAndUpdate(req.user._id,{ $set:{fullName,email:email} },{new:true}).select("-password")
  console.log(user);

  return res
  .status(200)
  .json(new ApiResponce(200,user,"fullName and email changed successfully"))

})


///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const changeAvatar=asyncHandler(async(req,res)=>{

  // get the new imagelocalpath using multer(req.file ) middleware
  // check the imagelocalpath
  // retrieve public_id of image
  //  delete old image from cloudinary using public_id
  // upload new file on cloudinary
  // check the url of image given by cloudinary
  // use the auth(verifyJWT) middleware to get user doc and update the image url
  //return res

  const avatarLocalPath=req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400,"avatar file is missing")
  }

////***********************************************////////

  const user= await User.findById(req.user._id)
  const avatarPublicId=user.avatar.public_id

  //  delete old image from cloudinary using public_id
  const delOldImgFromCloudinary=await deleteFromCloudinary(avatarPublicId)

  if (!delOldImgFromCloudinary) {
    throw new ApiError(500,"failed to delete old file from cloudinary")
  }

  ////***********************************************////////


  const avatar=await uploadOnCloudinary(avatarLocalPath)
  
  if (!(avatar.url && avatar.public_id)) {
    throw new ApiError(400,"error while uploading avatar")
  }

  const userUpdated= await User.findByIdAndUpdate(user._id,
    { $set:{avatar:{url:avatar.url , public_id:avatar.public_id}} }
    ,{new:true})
    .select("-password")

  return res
  .status(200)
  .json(new ApiResponce(200,userUpdated,"avatar  changed successfully"))

})

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const changeCoverImage=asyncHandler(async(req,res)=>{

  // get the new imagelocalpath using multer(req.file ) middleware
  // check the imagelocalpath
  // retrieve public_id of image
  //  delete old image from cloudinary using public_id
  // upload new file on cloudinary
  // check the url of image given by cloudinary
  // use the auth(verifyJWT) middleware to get user doc and update the image url
  //return res


  const coverImageLocalPath=req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400,"cover image file is missing")
  }

 ////***********************************************////////

  const user= await User.findById(req.user._id)
  const coverImagePublicId=user.avatar.public_id

  //  delete old image from cloudinary using public_id
  const delOldImgFromCloudinary=await deleteFromCloudinary(coverImagePublicId)

  if (!delOldImgFromCloudinary) {
    throw new ApiError(500,"failed to delete old file from cloudinary")
  }

  ////***********************************************////////


  const coverImage=await uploadOnCloudinary(coverImageLocalPath)
  
  if (!(coverImage.url && coverImage.public_id)) {
    throw new ApiError(400,"error while uploading coverImage")
  }

  const userUpdated= await User.findByIdAndUpdate(req.user._id,
    { $set:{coverImage:{ url: coverImage.url , public_id: coverImage.public_id }} },{new:true})
    .select("-password")

  return res
  .status(200)
  .json(new ApiResponce(200,userUpdated,"coverImage  changed successfully"))

})

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////


// This code makes a controller called getUserChannelProfile that retrieves detailed profile information for a user (channel) based on their username. 
// It uses MongoDB aggregation to fetch and process data, specifically joining user details and subscription information.

// This controller fetches a user's channel profile information, including:
// Basic Info: Name, username, avatar, email, etc.
// Subscribers Count: How many people follow this user.
// Channels Subscribed To Count: How many channels this user follows.
// Subscription Status: Whether the current logged-in user/(you or me) (from req.user) is subscribed to this channel.

//*********************////////*****************///////*************////**********************/******* */ */ */ */ */

// Real-Life Analogy
// Imagine you're running YouTube, and you want to see the profile of a content creator. This profile shows:

// The creator's name and username (basic info).
// Number of subscribers (how many people follow this creator).
// Number of channels they are subscribed to (their activity on YouTube).
// Whether you're subscribed to their channel (your relationship with them).
// This function essentially gathers all that data for display.

const getChannelProfile= asyncHandler(async(req,res)=>{

  const {userName}=req.params // let's say user name is "hitesh choudry"

  if (!userName?.trim()) {
    throw new ApiError(400,"username is missing")
  }

  ///********************************************************* */

  const chanel=await User.aggregate(
    [
      {
        $match:{
          userName:userName?.toLowerCase()
        },
      },
      //***************** */
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",        // hitesh choudry ky user walay document ma jo _id ha
          foreignField:"channel",  // subscriptions ky saray documents ka channel field match kar ky do,matlab jahan par bhi channel field ma localField wali id match karti ha wo saray do
          as:"subscribers",
        }
      },
      //********* *********/
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"subscriber", //subscriptions ky saray documents ka subscriber field match kar ky do,matlab jahan par bhi subscriber field ma localField wali id match karti ha wo saray do
          as:"subscribedTo"
        }
      },
      //***************** */
      {
        $addFields:{
          subscriberCount:{
            $size:"$subscribers"
          },
            subscribedToOtherChannelCount:{
            $size:"$subscribedTo"
          },
          isSubscribed:{
            $cond:{
              if:{$in:[req.user?._id,"$subscribers.subscriber"]},
              then:true,
              else:false
  
            }
          }
        }
      },
      //***************** */
      {
        $project:{
          userName:1,
          fullName:1,
          email:1,
          avatar:1,
          coverImage:1,

          subscriberCount:1,
          subscribedToOtherChannelCount:1,
          isSubscribed:1
        }
      } 
    ]
  )


  if (!chanel?.length) { // btw chanel will return an array with single or multiple objs,depends on match in user
    throw new ApiError(400,"chanel does not exist")
  }

  return res
  .status(200)
  .json(new ApiResponce(200,chanel[0],"User channel fetched successfully"))

})

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const watchHistory = asyncHandler( async (req,res)=>{
  
})

export { registerUser,
  loginUser,
  logoutUser,
  refreshAcceessToken,
  changePassword,
  getCurrentUser,
  changeDetails,
  changeAvatar,
  changeCoverImage,
  getChannelProfile, };
