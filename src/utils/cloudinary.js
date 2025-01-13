import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// uploading file from local server to cloudinary with async/await bcz uploading takestime

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // Ensures the function doesn't proceed if no file path is provided
    //upload to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto",});
    //console.log("local file is uploaded to cloudinary", response.url);

    fs.unlinkSync(localFilePath)

    return response; // for user
    

  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload failed bcz it might have virus or maybe invalid file etc
    return null;
  }
};

export default uploadOnCloudinary ;
