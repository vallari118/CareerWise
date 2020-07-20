const passport = require('passport');
const mongoose = require('mongoose');
const { use } = require('passport');
const { concatSeries } = require('async');
const User = mongoose.model('User'); // The model containing userSchema
const Post = mongoose.model('Post');
const Comment = mongoose.model('Comment');
const Message = mongoose.model('Message');
const Application = mongoose.model('Application');
const timeAgo = require("time-ago");


//a person should not sent more than one friend request to the same person
const containsDuplicate = function(array) {
    array.sort();
    for (let i = 0; i < array.length; i++) {
        if (array[i] == array[i + 1]) {
            return true;
        }
    }
}

const getRandom = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

const addToPosts = function(array, user) {
    for (item of array) {
        item.name = user.name;
        item.ago = timeAgo.ago(item.date);
        item.ownerid = user._id;
        item.ownerProfileImage = user.profile_image;
    }

}

const addCommentDetails = function(posts) {
    return new Promise(function(resolve, reject) {
        let promises = [];

        for (let post of posts) {
            for (let comment of post.comments) {
                let promise = new Promise(function(resolve, reject) {
                    User.findById(comment.commenter_id, "name profile_image", (err, user) => {

                        comment.commenter_name = user.name;
                        comment.commenter_profile_image = user.profile_image;
                        resolve(comment);
                    });

                });

                promises.push(promise);

            }
        }

        Promise.all(promises).then((val) => {

            resolve(posts);
        });
    });
}

const alertUser = function(fromUser, toId, type, postContent) {
    return new Promise(function(resolve, reject) {
        let alert = {
            alert_type: type,
            from_id: fromUser._id,
            from_name: fromUser.name,
        }

        if (postContent && postContent.length > 28) {
            postContent = postContent.substring(0, 28) + "...";
        }

        switch (type) {
            case "new_friend":
                alert.alert_text = `${alert.from_name} has accepted your friend request.`;
                break;
            case "liked_post":
                alert.alert_text = `${alert.from_name} has liked your post, '${postContent}'.`;
                break;
            case "commented_post":
                alert.alert_text = `${alert.from_name} has commented on your post, '${postContent}'.`;
                break;
            case "applied_post":
                alert.alert_text = `${alert.from_name} has applied on your post, '${postContent}'.`;
                break;
            default:
                return reject("No valid type for alert");
        }

        User.findById(toId, (err, user) => {
            if (err) { reject("Error:", err); return res.status(404).json(err) }
            user.new_notifications++;
            user.notifications.splice(18)
            user.notifications.unshift(JSON.stringify(alert)); //puts new notifications at top

            user.save((err) => {
                if (err) { reject("Error:", err); return res.status(404).json(err) }
                resolve();
            });
        });

    });
}



//Controllers
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


    user.name = body.first_name.trim() + " " + body.last_name.trim();
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
            const token = newUser.getJwt();
            res.status(201).json({ token });

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

            const token = user.getJwt();
            res.status(201).json({ token });
        } else {
            res.json(info)
        }


    })(req, res)


}

const generateFeed = function({ payload }, res) {

    const posts = [];
    const maxAmountOfPosts = 48;



    let myPosts = new Promise(function(resolve, reject) {
        User.findById(payload._id, "name profile_image friends posts", { lean: true }, (err, user) => {
            if (err) { return res.json({ err: err }); }
            addToPosts(user.posts, user);
            posts.push(...user.posts);
            resolve(user.friends);
        });

    });

    let myFriendsPost = myPosts.then((friendsArray) => {
        return new Promise(function(resolve, reject) {
            User.find({ '_id': { $in: friendsArray } }, "name profile_image posts", { lean: true }, (err, users) => {
                if (err) { return res.json({ err: err }); }
                for (user of users) {
                    addToPosts(user.posts, user);
                    posts.push(...user.posts);

                }
                resolve();

            });

        });

    });

    myFriendsPost.then(() => {
        posts.sort((a, b) => (a.date > b.date) ? -1 : 1);
        posts.slice(0, maxAmountOfPosts);
        addCommentDetails(posts).then((posts) => {
            res.statusJson(200, { posts: posts });
        });

    });



}

const getSearchResults = function({ query, payload }, res) {
    if (!query.query) { return res.json({ err: "Missing query" }); }
    //console.log(query);
    User.find({ name: { $regex: query.query, $options: "i" } }, "name friends profile_image friends_requests", (err, results) => {
        if (err) { return res.json({ err: err }); }

        //Only 20 search results will be visible at a time
        results = results.slice(0, 20);

        //User should not be able to search himself
        for (let i = 0; i < results.length; i++) {
            if (results[i]._id == payload._id) {
                results.splice(i, 1);
                break;
            }
        }


        //console.log(results);
        return res.status(200).json({ message: "Getting search results", results: results });
    });

}


const makeFriendRequest = function({ params }, res) {
    User.findById(params.to, (err, user) => {

        if (err) { return res.json({ err: err }) }


        if (containsDuplicate([params.from, ...user.friends_requests])) {

            return res.json({ message: "Friend request is already sent" });
        }

        user.friends_requests.push(params.from);
        user.save((err, user) => {
            if (err) { return res.json({ err: err }) }

            return res.statusJson(201, { message: "Successfully sent friend request" });

        });



    });



}

const getUserData = function({ params }, res) {
    User.findById(params.userid, "-salt -password", { lean: true }, (err, user) => {
        if (err) { return res.json({ err: err }) }

        function getRandomFriends(friendsList) {
            let copyOfFriendsList = Array.from(friendsList);
            let randomIds = []

            for (let i = 0; i < 6; i++) {
                if (friendsList.length <= 6) {
                    randomIds = copyOfFriendsList;
                    break;
                }
                let randomId = getRandom(0, copyOfFriendsList.length);
                randomIds.push(copyOfFriendsList[randomId]);
                copyOfFriendsList.splice(randomId, 1);

            }

            return new Promise(function(resolve, reject) {
                User.find({ '_id': { $in: randomIds } }, "name profile_image", (err, friends) => {
                    if (err) { return res.json({ err: err }) }
                    resolve(friends);

                });
            });

        }

        function addMessengerDetails(messages) {
            return new Promise(function(resolve, reject) {
                if (!messages.length) { resolve(messages); }

                let usersArray = [];

                for (let message of messages) {
                    usersArray.push(message.from_id);

                }


                User.find({ '_id': { $in: usersArray } }, "name profile_image", (err, users) => {
                    if (err) { return res.json({ err: err }) }

                    for (message of messages) {
                        for (let i = 0; i < users.length; i++) {
                            if (message.from_id == users[i]._id) {
                                message.messengerName = users[i].name;
                                message.messengerProfileImage = users[i].profile_image;
                                users.splice(i, 1);
                                break;
                            }
                        }
                    }

                    resolve(messages);
                });
            });
        }

        user.posts.sort((a, b) => (a.date > b.date) ? -1 : 1);

        addToPosts(user.posts, user);
        //console.log(user.posts);
        let randomFriends = getRandomFriends(user.friends);
        let commentDetails = addCommentDetails(user.posts);
        let messageDetails = addMessengerDetails(user.messages);

        Promise.all([randomFriends, commentDetails, messageDetails]).then((val) => {
            user.random_friends = val[0];
            user.messages = val[2];
            res.statusJson(200, { user: user });

        });





    });
}

const getFriendRequest = function({ query }, res) {

    let friendRequests = JSON.parse(query.friends_requests)
    User.find({ '_id': { $in: friendRequests } }, "name profile_image", (err, users) => {
        if (err) { return res.json({ err: err }) }
        res.statusJson(200, { message: "Getting friend requests", user: users })
    });

}

const resolveFriendRequest = function({ query, params }, res) {
    //It will find the logged in user
    User.findById(params.to, (err, user) => {
        if (err) { return res.json({ err: err }) }

        for (let i = 0; i < user.friends_requests.length; i++) {

            if (user.friends_requests[i] == params.from) {
                //Removing the person from friend request array
                user.friends_requests.splice(i, 1);
                break;
            }
        }

        let promise = new Promise(function(resolve, reject) {
            if (query.resolution == "accept") {
                //To check if the person is already in the friends list
                if (containsDuplicate([params.from, ...user.friends])) {
                    res.json({ message: "Duplicate Error" })

                }

                //Adding the person to the friends array
                user.friends.push(params.from);

                //It will find the users that sent the friend request
                User.findById(params.from, (err, user) => {
                    if (err) { return res.json({ err: err }) }
                    //To check if the person is already in the friends list
                    if (containsDuplicate([params.from, ...user.friends])) {
                        res.json({ message: "Duplicate Error" })

                    }
                    //Adding us to their friend list
                    user.friends.push(params.to);
                    user.save((err, user) => {
                        if (err) { return res.json({ err: err }) }
                        resolve();

                    });

                });
            } else {
                resolve();
            }

        });

        promise.then(() => {
            user.save(() => {
                if (err) { return res.json({ err: err }) }
                alertUser(user, params.from, "new_friend").then(() => {
                    res.statusJson(201, { message: "Resolved friend requests" });
                })
            });



        });


    });




}

const createPost = function({ body, payload }, res) {



    if (!body.content || !body.theme) {
        return res.statusJson(201, { message: "Insufficient data sent with the request" });
    }
    let userId = payload._id;

    const post = new Post();
    post.theme = body.theme;
    post.content = body.content;

    User.findById(userId, (err, user) => {
        if (err) { return res.json({ err: err }) }

        let newPost = post.toObject();
        newPost.name = payload.name;
        newPost.ownerid = payload._id;
        newPost.ownerProfileImage = user.profile_image;

        user.posts.push(post);
        user.save((err) => {
            if (err) { return res.json({ err: err }) }
            return res.statusJson(201, { message: "Created Post", newPost: newPost });
        })
    });





}

const likeUnlike = function({ payload, params }, res) {
    User.findById(params.ownerid, (err, user) => {
        if (err) { return res.json({ err: err }) }
        //payload id is the id of the user that has signed in
        //params id means in routes it has given 2 ids
        //ownerid and postid which is set in angular
        // console.log("Params.postid : ", params.postid);
        // console.log("=======");
        // console.log(params);

        const post = user.posts.id(params.postid);

        let promise = new Promise(function(resolve, reject) {
            if (post.likes.includes(payload._id)) {
                post.likes.splice(post.likes.indexOf(payload._id), 1);
                resolve();
            } else {
                post.likes.push(payload._id);

                if (params.ownerid != payload._id) {
                    User.findById(payload._id, (err, user) => {
                        if (err) { reject("Error:", err); return res.json({ err: err }) }
                        alertUser(user, params.ownerid, "liked_post", post.content).then(() => {
                            resolve();
                        });
                    });

                } else {
                    resolve();
                }


            }

        });

        promise.then(() => {
            user.save((err, user) => {
                if (err) { return res.json({ err: err }) }
                res.statusJson(201, { message: "Like or Unlike a post......." });
            });
        });


    });

}



const postCommentOnPost = function({ body, payload, params }, res) {


    User.findById(params.ownerid, (err, user) => {
        //console.log(params);

        if (err) {

            return res.json({ err: user });
        }

        const post = user.posts.id(params.postid);

        let comment = new Comment();
        comment.commenter_id = payload._id;
        comment.comment_content = body.content;
        post.comments.push(comment);

        user.save((err, user) => {
            if (err) {
                return res.json({ err: err });
            }

            User.findById(payload._id, "name profile_image", (err, user) => {
                if (err) {
                    return res.json({ err: err });
                }

                let promise = new Promise(function(resolve, reject) {
                    if (payload._id != params.ownerid) {
                        alertUser(user, params.ownerid, "commented_post", post.content).then(() => {
                            resolve();
                        });

                    } else {
                        resolve();
                    }
                });
                promise.then(() => {
                    res.statusJson(201, { message: "Posted Comment", comment: comment, commenter: user });
                });

            });

        });
    });

}



const sendMessage = function({ body, payload, params }, res) {
    //console.log(payload);

    let from = payload._id;
    let to = params.to;

    let fromPromise = new Promise(function(resolve, reject) {
        //find the sender
        User.findById(from, "messages", (err, user) => {
            if (err) {
                reject("Error", err);
                return res.json({ err: err });
            }
            from = user;
            resolve(user);
        });
    });

    let toPromise = new Promise(function(resolve, reject) {
        //find the receiver
        User.findById(to, "messages new_message_notifications", (err, user) => {
            if (err) {
                reject("Error", err);
                return res.json({ err: err });
            }
            to = user;
            resolve(user);
        });
    });

    let sendMessagePromise = Promise.all([fromPromise, toPromise]).then(() => {
        /*  console.log("==========")
         console.log("FROM", from)
         console.log("TO", to)
         console.log("===========") */


        function hasMessageFrom(messages, id) {
            for (let message of messages) {
                if (message.from_id == id) {
                    return message;
                }
            }
        }

        function sendMessageTo(to, from, notify = false) {
            return new Promise(function(resolve, reject) {

                if (notify && !to.new_message_notifications.includes(from._id)) {
                    to.new_message_notifications.push(from._id);

                }

                if (foundMessage = hasMessageFrom(to.messages, from._id)) {
                    foundMessage.content.push(message);
                    to.save((err, user) => {
                        if (err) {
                            reject("Error", err);
                            return res.json({ err: err });
                        }
                        resolve(user);
                    });
                } else {

                    let newMessage = new Message();
                    newMessage.from_id = from._id;
                    newMessage.content = [message];

                    to.messages.push(newMessage);
                    to.save((err, user) => {

                        if (err) {
                            reject("Error", err);
                            return res.json({ err: err });
                        }
                        resolve(user);

                    });

                }
            });
        }

        let message = {
            messenger: from._id,
            message: body.content
        }

        let sendMessageToRecipient = sendMessageTo(to, from, true);
        let sendMessageToAuthor = sendMessageTo(from, to);


        return new Promise(function(resolve, reject) {
            Promise.all([sendMessageToRecipient, sendMessageToAuthor]).then(() => {
                resolve();
            });

        });

    });
    sendMessagePromise.then(() => {

        return res.statusJson(201, {
            message: "Sending Message"
        });

    });

}

const resetMessageNotifications = function({ payload }, res) {
    User.findById(payload._id, (err, user) => {
        if (err) { return res.json({ err: err }) }

        user.new_message_notifications = [];
        user.save((err) => {
            if (err) { return res.json({ err: err }) }
            return res.statusJson(201, { message: "Reset message Notifications." });
        });
    });
}

const resetAlertNotifications = function({ payload }, res) {
    User.findById(payload._id, (err, user) => {
        if (err) { return res.json({ err: err }) }
        user.new_notifications = 0;
        user.save((err) => {
            if (err) { return res.json({ err: err }) }
            return res.statusJson(201, { message: "Reset alert Notifications." });
        });

    });

}

// const applyTo = function({ payload, params }, res) {

//     applicant_name = "";

//     User.findById({ '_id': payload._id }, "name", (err, user) => {
//         applicant_name = user.name;

//     });



//     User.findById(params.postOwnerId, (err, user) => {

//         if (err) { return res.json({ err: user }); }

//         if (user.applications.length > 0) {
//             console.log("Inside If")
//             for (let item of user.applications) {
//                 console.log(item.post_id, "======", params.postid);
//                 if (item.from_id == params.postOwnerId && item.post_id == params.postid) {
//                     console.log("Inside Inner If")

//                     if (item.applicant_id.indexOf(payload._id) !== -1) {
//                         console.log("Post owner and applicant for that post already exist");
//                         break;
//                     } else {
//                         console.log("New Application for same post")
//                         item.applicant_id.push(payload._id);
//                         item.applicant_name.push(applicant_name);

//                     }
//                 } else {
//                     console.log("New post of the owner will create new application");
//                     //console.log(user.applications.from_id, " AND ", params.postOwnerId);
//                     let application = new Application();
//                     application.post_id = params.postid; //Who has posted the application 
//                     application.from_id = params.postOwnerId;
//                     application.applicant_id = payload._id; // who will apply  

//                     application.applicant_name = applicant_name;


//                     user.applications.push(application);

//                 }

//             }
//             // console.log(user.applications);

//         } else {
//             console.log("First ever application");
//             let application = new Application();
//             application.post_id = params.postid; //Who has posted the application 
//             application.from_id = params.postOwnerId;
//             application.applicant_id = payload._id; // who will apply  

//             application.applicant_name = applicant_name;


//             user.applications.push(application);


//         }
//         //console.log(user.applications.from_id, " AND ", params.postOwnerId);

//         user.save((err, user) => {
//             if (err) {
//                 return res.json({ err: err });
//             }


//             res.statusJson(201, { message: "Applied successfully", application: user.applications });


//         });
//     });



// }

const deleteMessage = function({ payload, params }, res) {
    User.findById(payload._id, (err, user) => {
        if (err) { return res.json({ err: err }) }
        const message = user.messages.id(params.messageId).remove();

        user.save((err, user) => {
            if (err) { return res.json({ err: err }) }
            res.statusJson(201, { message: "Deleted Message" });
        })
    });

}


const deleteAllUsers = function(req, res) {
    User.deleteMany({}, (err, info) => {
        if (err) { return res.send({ error: err }); }
        return res.json({ message: "Deleted All Users", info: info });
    });
}

const getAllUsers = function(req, res) {
    User.find((err, users) => {
        if (err) { return res.send({ error: err }); }
        return res.json({ users: users });
    });
}


module.exports = {
    deleteAllUsers,
    getAllUsers,
    registerUser,
    loginUser,
    generateFeed,
    getSearchResults,
    makeFriendRequest,
    getUserData,
    getFriendRequest,
    resolveFriendRequest,
    createPost,
    likeUnlike,
    postCommentOnPost,
    sendMessage,
    resetMessageNotifications,
    deleteMessage,
    resetAlertNotifications,
    // applyTo

}