const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const httpStatus = require("http-status");
const User = require("../../models/user.model");
const OTP = require("../../models/otp.model");
const RefreshToken = require("../../models/refreshToken.model");
const APIError = require("../../errors/api-error");
const firebaseAdmin = require("../../middlewares/firebase-auth");
const { sendOTP } = require("../../services");
dayjs.extend(relativeTime);

function generateTokenResponse(user, accessToken) {
  const tokenType = "Bearer";
  const refreshToken = RefreshToken.generate(user).token;
  const expiresIn = 60 * 60 * 24 * 365;
  return {
    tokenType,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

exports.getOtp = async (req, res, next) => {
  try {
    const { email, otp } = await OTP.findAndGenerateOTP(req.body);
    if (email) {
      await sendOTP(email, otp);
      return res.json({ message: `Login code has been sent to ${email}` });
    }
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, code, type, access_token } = req.body;
    if (code) {
      const otp = await OTP.get({ otp: code, email });
      if (otp) {
        const currentTime = dayjs().unix();
        const otpCreatedAt = dayjs(otp.createdAt).unix();
        const timeDifference = currentTime - otpCreatedAt;
        if (timeDifference >= 5 * 60 * 1000) {
          throw new APIError({
            message: "Your login code has expired",
            status: httpStatus.BAD_REQUEST,
          });
        }
      }
    }

    let emailFormatted = email?.toLowerCase()?.trim();
    let name = null;

    if (type && type === "google") {
      const authResponse = await firebaseAdmin
        .auth()
        .verifyIdToken(access_token);

      if (authResponse) {
        emailFormatted = authResponse.email?.toLowerCase()?.trim();
        name = authResponse?.name;
      }
    }

    let user = await User.findOne({ email: emailFormatted });
    if (!user) {
      user = await User.create({
        email: emailFormatted,
        newUser: true,
        name: name,
        role: "user",
        active: true,
      });
      await user.save();
    } else {
      if (user.newUser) {
        user.newUser = false;
        user.active = true;
        await user.save();
      }
    }

    const token = generateTokenResponse(user, user.token());
    res.status(httpStatus.OK);
    res.cookie("team", team.uid, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
    });
    return res.json({ ...token });
  } catch (error) {
    console.log("error:", error);
    return next(error);
  }
};

exports.loggedOut = async (req, res, next) => {
  try {
    const { email } = req.body;
    let emailFormatted = email?.toLowerCase()?.trim();
    let user = await User.findOne({ email: emailFormatted });
    if (!user) {
      throw new APIError({
        message: "User not found!",
        status: httpStatus.UNAUTHORIZED,
      });
    } else {
      user.active = false;
      await user.save();
    }
    await user.save();
    res.status(httpStatus.OK);
    return res.json({
      message: "Logout successful",
    });
  } catch (error) {
    return next(error);
  }
};

exports.accountDetails = async (req, res, next) => {
  try {
    const { user } = req;
    let accountDetails = await User.findOne({ email: user.email });

    if (!accountDetails) {
      throw new APIError({
        message: "User not found!",
        status: httpStatus.UNAUTHORIZED,
      });
    }
    if (accountDetails.email !== user.email) {
      throw new APIError({
        message: "Unauthorized access to user profile!",
        status: httpStatus.FORBIDDEN,
      });
    }

    return res.json({ accountDetails });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.updateAccount = async (req, res, next) => {
  try {
    const { user } = req;
    const { name, profilePicture, bio, accountType, password, phone } =
      req.body;
    if (name) {
      user.name = name;
    }
    if (profilePicture) {
      user.profile_picture = profilePicture;
    }
    if (bio) {
      user.bio = bio;
    }
    if (job_title) {
      user.job_title = job_title;
    }
    if (accountType) {
      user.account_type = accountType;
    }
    if (phone) {
      user.phone = phone;
    }
    if (password) {
      user.password = password;
    }

    await user.save();
    res.status(httpStatus.OK);
    return res.json({
      message: "Profile updated successfully",
      ...user.transform(),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAllPublicProfiles = async (req, res, next) => {
  try {
    const { user } = req;
    let accountDetails = await User.findOne({ email: user.email });
    if (!accountDetails) {
      throw new APIError({
        message: "User not found!",
        status: httpStatus.UNAUTHORIZED,
      });
    }

    if (user.role === "admin") {
      let publicProfiles = await User.find({});

      if (publicProfiles) {
        return res.json({ publicProfiles });
      } else {
        throw new APIError({
          message: "No Profiles exist!",
          status: httpStatus.NOT_FOUND,
        });
      }
    }
    let publicProfiles = await User.find({
      account_type: "public",
      email: { $ne: user.email },
    });

    if (publicProfiles) {
      return res.json({ publicProfiles });
    } else {
      throw new APIError({
        message: "Profiles not found!",
        status: httpStatus.NOT_FOUND,
      });
    }
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
