var createError = require('http-errors');
var express = require('express');
var cors = require("cors");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var mongoose = require("mongoose");
var config = require("config");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var tenantRouter = require("./routes/tenant");
var authenticatorRouter = require("./routes/authenticator");

var app = express();

//DB setup
const databaseHost = process.env.DB_HOST || config.mongo.host || "mongo";
const databaseName = config.mongo.databaseName || "simplino_auth";
const databaseUrl = "mongodb://" + databaseHost + ":27017/" + databaseName;
console.log("Try to connect to database: " + databaseUrl);
mongoose.Promise = global.Promise;
mongoose
  .connect(databaseUrl, {
    useMongoClient: true
  })
  .catch(err => {
    console.log("Could not connect to database:", err);
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(
  cors({
    origin: [
      /localhost/,
      /\.simplino\.com/
    ],
    credentials: true,
    exposedHeaders: ["Content-Disposition"]
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/tenant', tenantRouter);
app.use('/authenticator', authenticatorRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
