const express = require('express');
const router = express.Router();

const forgotCtrl = require('../controllers/forgotPass');


// router.get("/forgot", function(req, res) {
//     res.render('forgot');

// });

router.post('/forgot', forgotCtrl.UpdatePass);

//after clicking the link in the mail
router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            //req.flash('error', 'Password reset token is invalid or has expired.');
            console.log('Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('/reset', { token: req.params.token });
    });
});

router.post('/reset/:token', forgotCtrl.resetToken);



module.exports = router; //Important line