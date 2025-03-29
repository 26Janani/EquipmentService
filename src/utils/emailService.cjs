const nodemailer = require('nodemailer');

// Configure transport
const transporter = nodemailer.createTransport({
    service: 'gmail',  // You can use any SMTP service provider
    auth: {
        user: 'subaarjun10@gmail.com',
        pass: 'htnk vany apef tkyx'  // Use App Password for security
    }
});

async function sendEmail(to, subject, text) {
    try {
        let info = await transporter.sendMail({
            from: '"Janani" <your-email@gmail.com>',
            to,
            subject,
            text
        });
        console.log("Email sent: ", info.messageId);
    } catch (error) {
        console.error("Error sending email: ", error);
    }
}

// 🔹 Add this line to test the function when running `node emailService.js`
sendEmail('jananisrinivasan11@gmail.com', 'Reminder to renew contracts!', 'Hello, welcome to mail integration')
    .then(() => console.log("✅ Test email function executed"))
    .catch(err => console.error("❌ Test email error:", err));
