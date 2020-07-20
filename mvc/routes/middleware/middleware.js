//This is a middleware for authorization
//It is used to extract the token sent with the request
//To know what should be generated for the which user
const jwt = require('express-jwt');

const authorize = jwt({
    secret: process.env.JWT_SECRET,
    userProperty: 'payload' //payload will be the decrypted web token that will be sent with the request

});

module.exports = {
    authorize
}