// Model–view–controller (MVC) is a software design pattern commonly used for developing user interfaces that divides the 
// related program logic into three interconnected elements. This is done to separate internal representations of information from the ways 
// information is presented to and accepted from the user.

//class is a blueprint for JS object
class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // Adds a "message" property
    this.code = errorCode; // Adds a "code" property
  }
}

module.exports = HttpError;