const transporterPromise = require("../config/email");
const { getNextEmailJob } = require("../queues/emailQueue");
const nodemailer = require("nodemailer");

const startEmailWorker = () => {
  console.log("📨 Email worker started");

  setInterval(async () => {
    const job = getNextEmailJob();
    if (!job) return;

    try {
      const transporter = await transporterPromise;

      const info = await transporter.sendMail({
        from: '"ATS System" <no-reply@ats.com>',
        to: job.to,
        subject: job.subject,
        text: job.body,
      });

      console.log("📧 Email sent");
      console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));
    } catch (err) {
      console.error("❌ Email sending failed", err);
    }
  }, 3000);
};

module.exports = { startEmailWorker };
