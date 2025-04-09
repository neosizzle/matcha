var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors')

var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');

var app = express();

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};

// settings
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/users', usersRouter);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({"detail": err.message});
});

module.exports = app;
