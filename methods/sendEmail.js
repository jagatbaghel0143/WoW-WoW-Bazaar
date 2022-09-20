// const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail');


module.exports = function (email, username, token, forgetPswdFlag, cb) {

    sgMail.setApiKey('[Write your private key]');
    if (!forgetPswdFlag) {
        const msg = {
            to: email, // Change to your recipient
            from: 'WOW WOW Bazaar<motivequotes4u@gmail.com>', // Change to your verified sender
            subject: `Welcome to WOW WOW Bazaar, ${username}`,
            // text: 'and easy to do anywhere, even with Node.js',
            html: `
            <h1>Dear Customer, Welcome to WOW WOW Bazaar </h1>
            <p>Congratulations, you have decided to join a 
            unique plateform which is not for everyone, here we will 
            charge you like everest for the best experience ever.

            But we are not sure about you. Please click on the link given
            below to verify yourself.</p>

            <a href="http://localhost:3000/verifyuser/${token}">Click here</a>        
          `,
        }
        sgMail.send(msg).then(() => {
            console.log('Email sent')
            cb(null, msg);
        }).catch((error) => {
            console.error(error)
            cb(errror, null);
        })
    } else {
        const msg = {
            to: email, // Change to your recipient
            from: 'WOW WOW Bazaar<motivequotes4u@gmail.com>', // Change to your verified sender
            subject: `Change your password, ${username}`,
            // text: 'and easy to do anywhere, even with Node.js',
            html: `
            <p>One Time Password OTP <strong>${token}</strong>.</p>
          `,
        }
        sgMail.send(msg).then(() => {
            console.log('Email sent')
            cb(null, msg);
        }).catch((error) => {
            console.error(error)
            cb(error, null);
        })
    }
}
