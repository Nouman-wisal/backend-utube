import mongoose ,{Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const videoschema= new Schema(
    {
       videoFile:{
        type:String, //cloudinary url here
        require:true

       },
       thumbnail:{
        type:String, //cloudinary url here
        required:true

       },
       title:{
        type:String,
        required:true

       },
       description:{
        type:String,
        required:true

       },
       duration:{
        type:Number,
        required:true

       },
       views:{
        type:Number,
        required:true

       },
       isPublished:{
        type:Boolean,
        default:true

       },
       owner:{
        type:Schema.Types.ObjectId,
        ref:"User"

       }

    },{timestamps:true}
)

videoschema.plugin(mongooseAggregatePaginate) // this aggregation pipeline will make our project advance level.

export const Video=mongoose.model("Video",videoschema)