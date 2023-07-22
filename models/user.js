const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const schema = mongoose.Schema;

const userSchema = new schema({
  name: { type: String, required: true },
  email: { type: String, required: true }, //Here we also have to check for if the email already registered using mongoose-unique-validator
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  //making it an array since one user can have multiple places
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
});
//since email is something that will be querried alot so we add unique which assign internal indexing in the database to perform querry faster

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
