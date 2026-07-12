const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'yashwanthn36@gmail.com',
        pass: 'eagnidmlexcghrhw'
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP connection failed:', error.message);
    } else {
        console.log('✅ SMTP connection verified! Sending test email...');
        transporter.sendMail({
            from: 'TransitOps <yashwanthn36@gmail.com>',
            to: 'yashwanthn36@gmail.com',
            subject: 'TransitOps SMTP Test',
            text: 'SMTP is configured and working correctly for TransitOps!'
        }, (err, info) => {
            if (err) {
                console.error('❌ Send failed:', err.message);
            } else {
                console.log('✅ Test email sent! Message ID:', info.messageId);
            }
        });
    }
});
