//google geocoding api is paid so i am using geoapify
const axios = require("axios");

const HttpError = require("../models/http-error");

const API_KEY = process.env.LOCATION_API_KEY;

async function getCoordsForAddress(address) {
  try{
    // return {
    //   lat: 40.7484474,
    //   lng: -73.9871516
    // };
    //encodeURIComponent helps to get rid of any special characters or white space and make it url friendly
    const response = await axios.get(
      `https://api.geoapify.com/v1/geocode/search?text=${address}&apiKey=${API_KEY}`
    );
  
    const data = response.data;
  
    if (!data || data.status === "ZERO_RESULTS") {
      const error = new HttpError(
        "Could not find location for the specified address.",
        422
      );
      throw error;
    }
  
    //returning longitude ann latitude
    const coordinates = data.features[0].geometry.coordinates;
  
    //checking for valid coordinates
    if (!coordinates || coordinates.length !== 2) {
      throw new Error("Invalid coordinates received.");
    }
  
    const [lng, lat] = coordinates; // Extract longitude and latitude from the coordinates
  
    //return { lat, lng };
    return coordinates;
  }catch (error) {
  console.log(error);
  throw new HttpError(
    "Could not find location for the specified address.",
    422
  );
  }
}

module.exports = getCoordsForAddress;
