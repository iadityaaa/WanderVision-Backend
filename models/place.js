const mongoose = require("mongoose");

const schema = mongoose.Schema;

const placeSchema = schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  address: { type: String, required: true },
  location: {
    lng: { type: Number, required: true },
    lat: { type: Number, required: true },
  },
  //Now the creater will be a real id provided here and which can be refrenced form user schema
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Place", placeSchema);
//Form here the name of the collection will be places
