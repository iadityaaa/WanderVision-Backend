//usinf multer middleware
// Multer: A node/express.js middleware tha heps us to work with 'multipart/form-data' instead just json but this allows us to deal with binary file data.
const multer = require("multer");
const uuid = require("uuid/v1");
//mapping the mime_type info provided by multer
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const fileUpload = multer({
  limits: 500000, //bytes
  //disk storage
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/images");
    },
    filename: (req, file, cb) => {
      //Want to extract he extension of the incoming file
      const ext = MIME_TYPE_MAP[file.mimetype];
      req.body.filename = uuid() + "." + ext;
      cb(null, req.body.filename);
    },
    //adding an extra layer of validation since everything in the frontend can be hacked
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype];
      // !! converts null/invalid to false else true
      let error = isValid
        ? null
        : new Error("Invalid mime type. Please change the image format.");
      cb(error, isValid);
    },
  }),
}); //Its an obj that has a bunch of preconfigured middlewares

module.exports = fileUpload;
