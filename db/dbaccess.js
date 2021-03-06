const MongoClient = require('mongodb').MongoClient;
var config = require('config');

// Modified to Work dockerized MongoDb : use localhost instead of database if you're not using the dockerized MongoDb AND calling from
// a dockerized node app, e.g. with monk it looks like this :
//var dbRecords = monk('database:27017/recordcollectiondb',null,null);
//var dbRecords = monk('localhost:27017/recordcollectiondb',null,null);
//const uri = 'mongodb://database:27017/';
console.log("process.env.NODE_ENV  = " + process.env.NODE_ENV);
const uri = config.get('dbUrl');
console.log("dbUrl  = " + uri);

// When running the node app inside a container and accessing the mongo DB running on the host which has launched the node app container,
// we use the hostname 'host.docker.internal'
//const uri = 'mongodb://host.docker.internal:27017/';

let _db;

const promiseRetry = require('promise-retry')

const options = {
    useNewUrlParser: true,
    reconnectTries: 60,
    reconnectInterval: 1000,
    poolSize: 10,
    bufferMaxEntries: 0
}

const promiseRetryOptions = {
    retries: options.reconnectTries,
    factor: 1.5,
    minTimeout: options.reconnectInterval,
    maxTimeout: 5000
}

const connectDB = async (callback) => {
    promiseRetry((retry, number) => {
        console.log(`MongoClient connecting to ${uri} - retry number: ${number}`)
        return MongoClient.connect(uri, options).then((dbServer) => {
            console.log('MongoClient connected !');
            _db = dbServer.db('recordcollectiondb');
            return callback();
        }).catch(retry)
    }, promiseRetryOptions)
}

const getDB = () => _db

const disconnectDB = () => _db.close()

module.exports = { connectDB, getDB, disconnectDB }