async function sendOTP(email, otp) {
  console.log(`Sending OTP ${otp} to ${email}...`);
  return new Promise((resolve, reject) => {
      setTimeout(() => {
          console.log(`OTP ${otp} sent successfully to ${email}.`);
          resolve();
      }, 2000);
  });
}

module.exports = {
  sendOTP: sendOTP,
};

