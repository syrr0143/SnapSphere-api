import nodemailer from 'nodemailer';



async function sendEmail(str, data) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "sy816120@gmail.com",
            pass: "uvayljjhxcayjhph",
        },
    });
    let Osubject, Otext, Ohtml;

    if (str == 'signup') {
        Osubject = `Thank you for signing up ${data.name}`;
        Ohtml = `
        <h1>Welcome to tastyBites</h1>
        <h2>Your account has been created successfully</h2>
        <p>Your account details are as follows</p>
        Name- ${data.name}
        Email-${data.email}`
    }
    else if (str == 'resetPassword') {
        Osubject = `Reset password`;
        Ohtml = `
        <h1>Reset your pasword for tastyBites</h1>
        <h2>Here is you password reset link</h2>
        <p>Your account details are as follows</p>
        link- ${data.resetpasswordLink}`
    }
    try {
        const info = await transporter.sendMail({
            from: `TastyBites <sy816120@gmail.com>`,
            to: data.email,
            subject: Osubject,
            html: Ohtml,
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

export { sendEmail };
