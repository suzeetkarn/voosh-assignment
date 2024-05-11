const mongoose = require('mongoose');
const logger = require('./logger');
const { env, mongo } = require('./vars');

// Exit application on error
mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err}`);
    process.exit(-1);
});

// print mongoose logs in dev env
if (env === 'development') {
   // mongoose.set('debug', true);
}

/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */

mongoose.appConn = mongoose
    .createConnection(mongo.app_uri, {
        keepAlive: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: mongo.db_name
    });
module.exports = mongoose;

