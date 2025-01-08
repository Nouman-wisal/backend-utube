

const asyncHandler=(apiRequestHandler)=>{
   return (req,res,next)=>{
        Promise.resolve(apiRequestHandler(req,res,next)).catch((error)=>next(error))
    }
}



export default asyncHandler;


// through  async await & try catch 
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     return await fn(req,res,next)
//   } 
//   catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

//or easy way to understand

// const asyncHandler = (func) => {
//   async (req, res, next) => {
//     try {
//       await func(req, res, next);
//     } catch (error) {
//       res.status(error.code || 500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   };
// };


