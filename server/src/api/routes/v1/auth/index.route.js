const express = require('express');
const { validate } = require('express-validation');
const controller = require('../../../controllers/auth');
const { authorize } = require('../../../middlewares/auth');

const {
    login,
    otp,
    profile,
} = require('../../../validations/auth');

const router = express.Router();

router.route('/get-otp')
    .post(validate(otp), controller.getOtp);

router.route('/login')
    .post(validate(login), controller.login);


router.route('/account')
    .get(authorize(), controller.accountDetails)
    .post(authorize(), validate(profile), controller.updateAccount);


router.route('/public-profiles')
    .get(authorize(), controller.getAllPublicProfiles);
    

module.exports = router;
