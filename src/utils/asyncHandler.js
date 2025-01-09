

const asyncHandler=(apiRequestHandler)=>{
   return (req,res,next)=>{
        Promise.resolve(apiRequestHandler(req,res,next)).catch((error)=>next(error))
    }
}



export default asyncHandler;


// through  async await & try catch 
// const asyncHandler = (apiRequestHandler) => async (req, res, next) => {
//   try {
//     return await apiRequestHandler(req,res,next)
//   } 
//   catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

//or easy way to understand

// const asyncHandler = (apiRequestHandler) => {
//   async (req, res, next) => {
//     try {
//       await apiRequestHandler(req, res, next);
//     } catch (error) {
//       res.status(error.code || 500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   };
// };


