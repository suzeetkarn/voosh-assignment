const mongoose = require("../../config/mogoose")
const {v4: uuidv4} = require('uuid')
const APIError = require("../errors/api-error");
const httpStatus = require("http-status");
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    uid: {
        type: String,
        default: '',
    },
    otp: {
        type: String,
        maxlength: 128,
        trim: true
    },
    user: {
        type: String,
        required: true,
        trim: true
    }
}, {timestamps: true})

otpSchema.pre('save', async function save(next) {
    try {
        if(!this.uid || this.uid === '') {
            this.uid = uuidv4();
        }
        return next();
    } catch (error) {
        return next(error);
    }
});

/**
 * Statics
 */
otpSchema.statics = {

    async generateOTP(email) {
        const ascii_chars = Array.from(Array(90).keys()).slice(65).map(a => String.fromCharCode(a))
        const code = Array.from({length: 6}, () => ascii_chars[Math.floor(Math.random() * ascii_chars.length)]).join('');
        const otp = new OTP({
            user: email,
            otp: code,
        })
        await otp.save()
        return code
    },

    async findAndGenerateOTP(options) {
        const {email} = options;
        if (!email) throw new APIError({message: 'An email is required to generate an OTP'});
        const otp = await this.generateOTP(email)
        return {email, otp: otp};
    },

    async get({otp, email}) {
        const user = await this.findOne({
            user: email,
            otp: otp
        }).sort("-createdAt").exec();
        if (user) {
            return user;
        }

        throw new APIError({
            message: 'Invalid Login Code',
            status: httpStatus.NOT_FOUND,
        });
    }
}


const OTP = mongoose.appConn.model("otps", otpSchema);
module.exports = OTP;
