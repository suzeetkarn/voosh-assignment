const mongoose = require("../../config/mogoose")
const APIError = require("../errors/api-error");
const httpStatus = require("http-status");
const dayjs = require("dayjs");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config/vars");
const { v4: uuidv4 } = require("uuid");
const Schema = mongoose.Schema;

const roles = ["user", "admin"];
const accountType = ["public", "private"];

const userSchema = new Schema(
  {
    uid: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
      maxlength: 128,
      index: true,
      trim: true,
    },
    profile_picture: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      unique: true,
      match: /^\S+@\S+\.\S+$/,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      maxlength: 10,
    },
    password: {
      type: String,
      default: "",
      maxlength: 128,
    },
    active: {
      type: Boolean,
      required: true,
      default: false,
    },
    new_user: {
      type: Boolean,
      default: true,
    },
    bio: {
      type: String,
      default: null,
    },
    account_type: {
      type: String,
      enum: accountType,
      default: "public",
    },
    role: {
      type: String,
      enum: roles,
      default: "user",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function save(next) {
  try {
    if (!this.uid || this.uid === "") {
      this.uid = uuidv4();
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "uid",
      "name",
      "email",
      "profile_picture",
      "bio",
      "role",
      "account_type",
      "phone",
      "password",
      "createdAt",
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  token() {
    const payload = {
      id: this._id,
    };
    return jwt.sign(payload, jwtSecret, {
      algorithm: "HS256",
      expiresIn: 60 * 60 * 24 * 30,
    });
  },

  async saveUser({
    user,
    name,
    email,
    password,
    profile_picture,
    bio,
    account_type,
    phone,
    active,
  }) {
    if (user) {
      user.name = name;
      user.profile_picture = profile_picture;
      user.email = email;
      user.bio = bio;
      user.active = active;
      user.phone = phone;
      user.password = password;
      user.account_type = account_type;
    } else {
      user = await User.findOne({
        email: email,
      });
      if (!user) {
        user = new User({
          name,
          profile_picture,
          email,
          bio,
          phone,
          password,
          account_type,
          active,
        });
        await user.save();
      }
    }
  },
});
userSchema.statics = {
  roles,
  /**
   * Find user by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, refreshObject } = options;
    if (!email)
      throw new APIError({
        message: "An email is required to generate a token",
      });

    const user = await this.findOne({ email }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (refreshObject && refreshObject.userEmail === email) {
      if (dayjs(refreshObject.expires).isBefore()) {
        err.message = "Invalid refresh token.";
      } else {
        return { user, accessToken: user.token() };
      }
    } else {
      err.message = "Incorrect email or refreshToken";
    }
    throw new APIError(err);
  },
  async generateApiKey(user) {
    user.apiKey = uuidv4();
    await user.save();
    return user;
  },
  checkDuplicateEmail(error) {
    if (error.name === "MongoError" && error.code === 11000) {
      return new APIError({
        message: "Validation Error",
        errors: [
          {
            field: "email",
            location: "body",
            messages: ['"email" already exists'],
          },
        ],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },
};
module.exports = mongoose.appConn.model("users", userSchema);
