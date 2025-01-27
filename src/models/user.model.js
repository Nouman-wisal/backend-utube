import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String, // encrypted/hash(****)your password through bcrypt npm package
      required: [true, "Password is required"],
      unique: true,
    },

    avatar:{

      url:{
        type:String, // cloudinary url here
        required:true
      },
      public_id:{  // cloudinary public_id here
        type:String,
        // required:true
      }
    },

    coverImage: {
      
      url:{
        type: String,// cloudinary url here
      },
      public_id:{
        type: String,// cloudinary public_id here
      }
     },
     
    refreshTokens: {
      type: String,
    },
    watchHistory: [ // write this in localField in $lookup bcz this is the local field you want the IDs stored in ,aggregationpipeline
      { 
      type: Schema.Types.ObjectId,  // this in foreignField
      ref: "Video",  //  in from 
      }
    ],
  },
  { timestamps: true }
);

// use async/await bcz encryption takes time,use next to pass the flag to next middleware.

userSchema.pre("save", async function (next) {
  if (!this.isModified("password"))  next();// "this" in this.modified represent the userSchema. 

  this.password = await bcrypt.hash(this.password, 10);
  next(); 

 // it encrypts pasword over&over if any feild is modified,we only want to re-encrypt pasword when password is modified.

});

// make custom methods(like in constructor functions)to compare encrypted password in db with user given password(like 123abc) before importing User model 

//* . bcrypt can also comapre password with user one to check, while hashing it. 

userSchema.methods.isPasswordCorrect= async function (password){ 
   return await bcrypt.compare(password,this.password) 
   
   // this.password is encrypted & password is given by user and result will be either true or false.
}

//********************************************************************************* */

//                              ** Generating Access tokens in userSchema **
 
userSchema.methods.generateAccessTokens=function (){ //no need for async/await bcz they're generated fast

    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName,
            fullName: this.fullName,
            email: this.email
        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}

//                               ** Generating Refresh tokens in userSchema **
 
userSchema.methods.generateRefreshTokens=function(){
    return jwt.sign(
        {
            _id : this._id
        },

        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema);
