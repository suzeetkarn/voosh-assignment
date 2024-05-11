const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const methodOverride = require('method-override');
const helmet = require('helmet');
const passport = require('passport');
const morgan = require("morgan");
const cors = require('cors');
const { logs } = require('./vars');
const routes = require('../api/routes/v1');
const error = require('../api/middlewares/error');
const strategies = require("./passport");
const app = express();

// request logging. dev: console | production: file
app.use(morgan(logs));

// parse body params and attache them to req.body
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({
    limit: "100mb",
    extended: true
}));
app.use(cookieParser());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());
app.use(passport.initialize());
passport.use('jwt', strategies.jwt);

app.use('/v1', routes);

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);

module.exports = app;
