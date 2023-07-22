const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controllers');
const fileUpload = require('../custom-middleware/file-upload');

const router = express.Router();

router.get('/', usersController.getUsers);

router.post(
  '/signup',
  fileUpload.single('image'), //Uing single middleware from multer middleware package whcih helps us to get a single file
  //This tell multer to extract the file having an image key in the upcoming req
  [
    check('name')
      .not()
      .isEmpty(),
    check('email')
      .normalizeEmail() // Test@test.com => test@test.com
      .isEmail(),
    check('password').isLength({ min: 6 })
  ],
  usersController.signup
);

//No need for validation in login because it will already get dealt with when we compare email and pass form the data stored
router.post('/login', usersController.login);

module.exports = router;
