const MongoClient = require('mongodb').MongoClient
const uri = 'mongodb://localhost/'
let _db

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