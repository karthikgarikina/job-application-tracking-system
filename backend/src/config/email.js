const nodemailer = require("nodemailer");

let transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
});

module.exports = transporterPromise;
