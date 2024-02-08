var express = require('express');
const bodypaser =require("body-parser");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressSession = require('express-session')


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const gotoMain = require('./routes/mainRouter');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  expressSession({
    secret: "my key",
    resave: true,
    saveUninitialized: true,
  })
);

app.use((req,res,next)=>{

    res.locals.user_name = "";


    if (req.session.user) {

        res.locals.user_name = req.session.user.name; //???? 

    }

    next();




   






});



app.use('/', gotoMain)

module.exports = app;
