const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User'); // The model containing userSchema
var nodemailer = require("nodemailer");
var async = require("async");
var crypto = require("crypto");
const { token } = require('morgan');



const UpdatePass = function(req, res, next) {
    //Array of functions executed one by one
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex'); //creates the token for updating password

                done(err, token);
            });

        },



        function(token, done) {
            //checks if email id is valid
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    //req.flash('error', 'No account with that email address exists.');
                    console.log('No account with that email address exists.');
                    return res.status(401).json({ msg: 'Email id does not exist' });
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // Token expires after 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'navivallari@gmail.com',
                    pass: 'krtqujpuhlalptjx'
                }
            });
            var mailOptions = {
                to: user.email, //email entered
                from: 'navivallari@gmail.com',
                subject: 'Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://localhost:4200' + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                //req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });


        },


    ], function(err) {
        if (err) return next(err);
        res.status(200).json({ msg: 'Email is sent. Please Check' });


    });
}

const resetToken = function(req, res) {
    async.waterfall([
        function(done) {

            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    console.log("------------");
                    console.log(req.params.token);
                    console.log("------------");

                    console.log("------------");
                    //req.flash('error', 'Password reset token is invalid or has expired.');
                    console.log('Password reset token is invalid or has expired.');
                    return res.status(401).json({ message: "'Password reset token is invalid or has expired.'" });
                }
                if (req.body.password === req.body.password_confirm) {
                    //passowrd is changed and token and date are cleared

                    user.setPassword(req.body.password);
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    console.log('password' + user.password + 'and the user is' + user)

                    user.save((err, newUser) => {
                        if (err) {
                            res.status(400).json(err);

                        } else {
                            done(err, newUser); //important

                        }

                    });
                } else {
                    //req.flash("error", "Passwords do not match.");
                    console.log("Passwords don't match")
                    console.log("===========")
                    console.log(req.body)
                    console.log("===========")
                    console.log(req.body.confirm)
                    return res.redirect('back');
                }
            });
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'navivallari@gmail.com',
                    pass: 'krtqujpuhlalptjx'
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'navivallari@mail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                //req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.status(200).json({ msg: "Password Updated Successfully" });


    });
}


module.exports = {
    UpdatePass,
    resetToken
}