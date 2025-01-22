import mongoose,{Schema} from "mongoose";


const subscriptionSchema=new Schema(
    {

        subscriber:{ // the one who is subscribing
            type:Schema.Types.ObjectId,
            ref:"User"
        },

        channel:{ //the channel who is subscribed to by subscriber
            type:Schema.Types.ObjectId,
            ref:"User"
        }


    },{timestamps:true}
)

export const Subscription=mongoose.model("Subscription",subscriptionSchema)