const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User'); // The model containing userSchema



const registerUser = function({ body }, res) {



    if (!body.first_name ||
        !body.last_name ||
        !body.email ||
        !body.password ||
        !body.password_confirm
    ) {
        return res.send({ message: "All fields are must" });
    }

    if (body.password != body.password_confirm) {
        return res.send({ message: "Passwords don't match" });
    }

    const user = new User();

    user.firstname = body.first_name.trim();
    user.lastname = body.last_name.trim();
    user.email = body.email;
    user.setPassword(body.password);

    //save the user in database
    user.save((err, newUser) => {
        if (err) {
            if (err.errmsg && err.errmsg.includes("duplicate key error")) {
                return res.json({ message: "The provided email is already registered!" });
            }


            return res.json({ message: "Something went wrong" });

        } else {
            res.status(201).json({ message: "Created User", user: newUser });

        }

    });

}

const loginUser = function(req, res) {
    //To check if user entered all fields
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    //This method will call the strategy method from passport.js
    passport.authenticate("local", (err, user, info) => {
        if (err) { return res.status(404).json(err) }
        if (user) {
            res.status(200).json({ message: "Log in Successful" })
        } else {
            res.status(401).json(info)
        }


    })(req, res)


}


module.exports = {
    registerUser,
    loginUser
}