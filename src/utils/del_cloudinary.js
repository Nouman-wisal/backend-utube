import { v2 as cloudinary } from "cloudinary";
import ApiError from "./ApiError.js";

const deleteFromCloudinary = async (imagePublic_id)=>{
    try {

        if (!imagePublic_id) {
            throw new ApiError(400,"image public_id is required")
        }

       const response= await cloudinary.uploader.destroy(imagePublic_id)
       console.log(`cloudinary deletion response ::: ${response} `);


       if (response.result !=="ok") {
        throw new ApiError(501,"image failed to be deleted")
       }


       if (response.result !=="not found") {
        throw new ApiError(501,"image not found in cloudinary, skipping deletion")
       }

    } catch (error) {
        throw new ApiError(500,error?.message || "image failed to be removed from cloudinary")
    }
}

export default deleteFromCloudinary;