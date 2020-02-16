const MongoClient = require('mongodb').MongoClient;

// Modified to Work dockerized MongoDb : use localhost instead of database if you're not using the dockerized MongoDb AND calling from
// a dockerized node app, e.g. with monk it looks like this :
//var dbRecords = monk('database:27017/recordcollectiondb',null,null);
//var dbRecords = monk('localhost:27017/recordcollectiondb',null,null);

// When running the node app inside a container and accessing the mongo DB running on the host which has launched the node app container,
// we use the hostname 'host.docker.internal'
const uri = 'mongodb://host.docker.internal:27017/';

let _db;

const connectDB = async (callback) => {
    try {
        MongoClient.connect(uri, (err, dbServer) => {
            _db = dbServer.db('recordcollectiondb')
            return callback(err)
        })
    } catch (e) {
        throw e
    }
}

const getDB = () => _db

const disconnectDB = () => _db.close()

module.exports = { connectDB, getDB, disconnectDB }