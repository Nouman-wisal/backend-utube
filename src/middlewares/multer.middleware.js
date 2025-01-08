import multer from "multer";



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./Public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // originalname is not prefferd bcz multile files with same name can overwrite eachother.
    }
  })
  
  export const upload = multer({ storage: storage })






  // this is for keeping the name in modified way.for now we are using simple way.
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//     cb(null, file.fieldname + '-' + uniqueSuffix)
//   }