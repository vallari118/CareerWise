const express = require('express');
const router = express.Router();
const middleware = require('./middleware/middleware');

const userCtrl = require('../controllers/users');
const { getUserData } = require('../controllers/users');




//Logging In & Registering
router.post('/register', userCtrl.registerUser);
router.post("/login", userCtrl.loginUser);

//Get Requests
router.get('/generate-feed', middleware.authorize, userCtrl.generateFeed);
router.get('/get-user-data/:userid', middleware.authorize, userCtrl.getUserData);
router.get('/get-search-results', middleware.authorize, userCtrl.getSearchResults);

//Routes Handling friend requests
router.post('/make-friend-request/:from/:to', middleware.authorize, userCtrl.makeFriendRequest);
router.get('/get-friend-request', middleware.authorize, userCtrl.getFriendRequest);
router.post('/resolve-friend-request/:from/:to', middleware.authorize, userCtrl.resolveFriendRequest);

//Routes Handling posts
router.post('/create-post', middleware.authorize, userCtrl.createPost);
router.post('/like-unlike/:ownerid/:postid', middleware.authorize, userCtrl.likeUnlike);
router.post('/post-comment/:ownerid/:postid', middleware.authorize, userCtrl.postCommentOnPost);


//Routes Handling messages
router.post('/send-message/:to', middleware.authorize, userCtrl.sendMessage);
router.post('/reset-message-notifications', middleware.authorize, userCtrl.resetMessageNotifications);
router.post('/delete-message/:messageId', middleware.authorize, userCtrl.deleteMessage);

//Misc Routes
router.post('/reset-alert-notifications', middleware.authorize, userCtrl.resetAlertNotifications);

//Apply routes
//router.post('/apply-to/:postOwnerId/:postid', middleware.authorize, userCtrl.applyTo);

//Development and Testing Only !
router.delete('/all', userCtrl.deleteAllUsers);
router.get('/all', userCtrl.getAllUsers);



module.exports = router;