//const uuid = require('uuid/v4'); using this to assign a unique id to specific user but know it can be done by mongodb
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");
//This is the second part of input validation which gives us the result for the middlewares called
const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place.js");
const User = require("../models/user.js");
const place = require("../models/place.js");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }
  //The params property in the end holds an object where your dynamic segments here will exist as keys and the value will be the concrete value the user who sent the request entered,
  //so here we can access request params.pid and get the concrete ID that is encoded in the URL.

  //Simple JS find (in array) function
  // const place = DUMMY_PLACES.find(p => {
  //   return p.id === placeId;
  // });
  //find() is a static fn here which means it will directly act on the databse document
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place",
      500
    );
    return next(error);
  }

  if (!place) {
    //res.status(404).json({message: 'couldnt find the place youre looking for'})
    //throw when we are in a synchronous action
    //throw new HttpError('Could not find a place for the provided id.', 404);
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }
  //Its better to convert the mongoose to a normall js obj in res, also we are setting the id as string using mongoose property getters
  res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

// function getPlaceById() { ... }
// const getPlaceById = function() { ... }

//We can also do it using populate method by which we can access the user with the user id and then respond directly with all the places the user has.
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  //use filter here an dnot find since user can have multiple places
  // const places = DUMMY_PLACES.filter(p => {
  //   return p.creator === userId;
  // });
  let places;
  try {
    //find in mongoose give directly an array
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place",
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    //return next(error) when we are in an asynchronous action
    //With next you need to return else code below this will get executed(not in case of throw)
    return next(new HttpError("This user has no visted places yet.", 404));
  }
  //here to Obj cannot br use as find in mongoose returns an array
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

//fetching using axios and using async and await to deal with the asynchronous operation
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //Here next() is mandatory since we are dealing with async function
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
      //error 422:req cannot be processed due to invalid data
    );
  }
  //destructuring the json data body fetching data from the data body extracted by body-parser
  const { title, description, address, creator } = req.body;

  //If we wana catch error after async await then use try catch return
  let coordinates, long, lati;
  try {
    coordinates = await getCoordsForAddress(address);
    long = coordinates[0];
    lati = coordinates[1];
  } catch (error) {
    //console.log(error);
    return next(error);
  }
  console.log(req.body);
  // const title = req.body.title;
  const createdPlace = new Place({
    //creates a unique id and store it in the id field
    //id: uuid(),
    title,
    description,
    image: req.file.path,
    address,
    location: {
      lng: long,
      lat: lati,
    },
    creator,
  });

  //Only if user exist then we can store places for him
  let user;
  try {
    user = await User.findById(creator);
    //This might also return an empty obj so we check below if the user already exists or not.
  } catch (err) {
    return next(new HttpError("Creating place failed, Please try again.", 500));
  }

  if (!user) {
    const error = new HttpError(
      "We could not find the user for the given id",
      404
    );
    return next(error);
  }

  //DUMMY_PLACES.push(createdPlace); //unshift(createdPlace)

  //Now if the user exists we can do 2 things : store the created place in the database and add the corresponding id to the user
  // Executing multiple independent operations and if any one fails we must return error

  //Using sessions and transactions(allows multiple operation to be exe independently)
  //With transactions we must have the given collection already present in the database (its working withourt anything also)
  try {
    //await createdPlace.save();
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    //This is not a normal JS push but a mongoose feature which allows to establish connection among them bts.
    //BTS mongoose get place id only and add it to the user

    //saving the updated user
    await user.save({ sessions: sess });
    await sess.commitTransaction();
  } catch (err) {
    //Error can occur if our db is down or the db validation fails
    const error = new HttpError("Creating place failed, please try again", 500);
    console.log(err);
    return next(error);
  }

  //200 is normal success code (if we create something new the convention is to send 201 )
  res.status(201).json({ place: createdPlace });
};

//Updating title and description (patch request)
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  //Objects are reference values in JS so we need to update it in a immutable way
  //creating a copy of the object using spread operator
  // const updatedPlace = { ...DUMMY_PLACES.find(p => p.id === placeId) };
  // const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
  let updatedPlace;
  try {
    updatedPlace = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update the place",
      500
    );
    return next(error);
  }

  if (updatedPlace.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You are not authorized to access this place.",
      401
    );
    return next(error);
  }

  //Why am i able to change a const here?? Check  primitive vs referenced values in JS
  //Basically const store the address of the object
  updatedPlace.title = title;
  updatedPlace.description = description;

  //Once the entire object is updated then only we are tampering with the actual data (since if we lose some data in middle it wont cause any mix match)
  //DUMMY_PLACES[placeIndex] = updatedPlace;
  try {
    await updatedPlace.save();
  } catch (err) {
    const error = new HttpError("Updating place failed, please try again", 500);
    console.log(err);
    return next(error);
  }

  res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  //When we delete a place we need to make sure that this place is also deleted for the existing user (We use populate method for that)
  const placeId = req.params.pid;
  //checking if the place exist before deleting it
  // if (!DUMMY_PLACES.find(p => p.id === placeId)) {
  //   throw new HttpError('Could not find a place for that id.', 404);
  // }

  let place;
  try {
    //populate allows us to access a doc stored in some other collection and to manipulate that data
    //with the populate field the place holds the full user object
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update the place",
      500
    );
    console.log(err);
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Sorry! Couldn't find the given place.", 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not authorized to delete this place.",
      401
    );
    return next(error);
  }

  const imagePath = place.image;

  //updating our dummy places data
  //returns a brand new array filtered acc to our condition
  //We are replacing the dummy places with the new array
  //DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    //await place.remove({ session: sess });
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess }); //Here creator thanks to populate gave access to the full user object associated with that creator id
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the place",
      500
    );
    console.log(err);
    return next(error);
  }

  fs.unlink(imagePath,(err)=>{
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place." });
};

//when we ehave multiple exports node also has alternative syntax
//We gust give a pointer to the function so that expreas will know which function to access based on the request
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
