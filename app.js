//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const md5 = require('md5');
const bcrypt = require('bcrypt');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", async function(req, res){
    console.log('Request Body ->', req.body);

    bcrypt.hash(req.body.password, Number(process.env.SALTROUNDS), async function(err, hash) {
        if(err){
            console.log('Unable to hash password ->', err);
            res.send(err);
        } else {
            const newUser = User({
                username: req.body.username,
                password: hash
            });
            let response = await newUser.save();
            newUser.save().then(function(err, response){
                if(err){
                    console.log('Error ->', err);
                } else {
                    console.log('Register response ->', response);
                }
            })
            res.render('secrets');
        }
    });
});

app.post("/login", async function(req, res){
    console.log('Request Body ->', req.body);

    const username = req.body.username;
    const password = req.body.password;



    await User.findOne({username: username}).then(function(foundData, err){
        if(err){
            console.log('Error ->', err);
        } else {
            if(foundData){
            console.log('Found data ->',foundData);
            bcrypt.compare(password, foundData.password, function(err, result) {
                if(err){
                    console.log('Error authenticating user ->', err);
                } else if(result === true ) {
                    console.log('User authenticated ->', result);
                    res.status(200).render('secrets');
                }
            });
        }
        }
    });
});



app.listen(3030, function(){
    console.log('Server started on port 3030');
});