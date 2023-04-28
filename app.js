//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const md5 = require('md5');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const passportlocalmongoose = require('passport-local-mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});
userSchema.plugin(passportlocalmongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get('/secrets', function(req, res){
    if(req.isAuthenticated()){
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res){
    req.logout(function(err){
        if(err){
            console.log('Error logging out user ->', err);
            res.redirect('/secrets');
        }
    });
    res.redirect('/');
})

app.post("/register", async function(req, res){
    console.log('Request Body ->', req.body);

    // bcrypt.hash(req.body.password, Number(process.env.SALTROUNDS), async function(err, hash) {
    //     if(err){
    //         console.log('Unable to hash password ->', err);
    //         res.send(err);
    //     } else {
    //         const newUser = User({
    //             username: req.body.username,
    //             password: hash
    //         });
    //         let response = await newUser.save();
    //         newUser.save().then(function(err, response){
    //             if(err){
    //                 console.log('Error ->', err);
    //             } else {
    //                 console.log('Register response ->', response);
    //             }
    //         })
    //         res.render('secrets');
    //     }
    // });

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err){
            console.log('Error registering user ->', err);
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            })
        }
    })
});

app.post("/login", async function(req, res){
    console.log('Request Body ->', req.body);

    // const username = req.body.username;
    // const password = req.body.password;



    // await User.findOne({username: username}).then(function(foundData, err){
    //     if(err){
    //         console.log('Error ->', err);
    //     } else {
    //         if(foundData){
    //         console.log('Found data ->',foundData);
    //         bcrypt.compare(password, foundData.password, function(err, result) {
    //             if(err){
    //                 console.log('Error authenticating user ->', err);
    //             } else if(result === true ) {
    //                 console.log('User authenticated ->', result);
    //                 res.status(200).render('secrets');
    //             }
    //         });
    //     }
    //     }
    // });

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err){
            console.log('Error logging in ->', err);
            res.send(400).json({message: "Bad request"});
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            })
        }
    })
});



app.listen(3030, function(){
    console.log('Server started on port 3030');
});