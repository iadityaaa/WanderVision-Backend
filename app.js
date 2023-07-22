const fs = require('fs');
const path = require('path');

const express = require("express");
//Used to get data out of the body (useful for post requests)
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mzv1edu.mongodb.net/${process.env.DB_NAME}`;//The name of the database will be places

const app = express();

//middleware will be parsed form top to bottom
app.use(bodyParser.json());
//This will extract any json data and call next automatically so that we reach next middleware in line and also add this data there

//file req middleware to access file stored in our database for display
app.use('/uploads/images',express.static(path.join('uploads','images'))); //this joins two paths uploads and images and create a new path pointing uploads/images folder

//corsHandler middleware
//CORS is just a browser concept (i.e) POSTMAn won't care abt it
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin', '*');
  //Now we specify which headers reqs may have to access the data
  res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE');
  next();
});

app.use("/api/places", placesRoutes); // => /api/places...
app.use("/api/users", usersRoutes);

//new normal middleware which will run when the above middleqares doesnot send a response
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

//Special middleware function
//When we pass 4 parameters express will automatically treat as a middleware function
//Error handler middleware
app.use((error, req, res, next) => {
  if(req.file){ //multers property to check for a file
    //using file system module of node js to delete file if any error occured
    fs.unlink(req.file.path,()=>{
      console.log(error);
    });
  }
  if (res.headerSent) {
    //called next and forwarded error
    return next(error);
  }
  //either error code is set or we will set status to 500 indicating something went wrong with the server
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

//If connection to database successful then only starting the backend
mongoose
  .connect(url)
  .then(() => {
    app.listen(5000);
    console.log("Databse connected and starting the server at lh:5000");
  })
  .catch((error) => {
    console.log(error);
  });
