const express = require('express');
const mongodb = require('mongodb');
const router = express.Router();
const _ = require('lodash');

// Load MongoDB utils
const MongoDBAccess = require('../db/dbaccess');

const fs = require('fs');
const auth = require('../auth/middleware/auth.service');

// set up rate limiter: maximum of 100 requests per minute
const RateLimit = require('express-rate-limit');
const studioLimiter = RateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000, // max requests per windowMs 
  message: "Keep quiet, maybe get a life instead of spamming the api.",
  headers: true
});

/* GET to Search Studios Service (NB: this route require authentication) */
router.get('/searchstudios/', studioLimiter, auth, function (req, res) {

    console.log(req.query);

    // Set our collection
    var collection = getCollection();

    var searchRequest = {};

    if ((typeof req.query.name !== typeof undefined) && (req.query.name != '')) {
        let safeName = _.escapeRegExp(req.query.name);
        searchRequest.name = { $regex: new RegExp('.*' + safeName + '.*', 'i') };
    }

    var searchOptions = {};
    searchOptions.sort = getSortOptions(req.query.sort);

    if (req.query.limit != null) {
        searchOptions.limit = Number(req.query.limit);
    }
    if (req.query.skip != null) {
        searchOptions.skip = Number(req.query.skip);
    }

    console.log(searchRequest);

    if (req.query.limit != null || req.query.skip != null) {
        collection.find(searchRequest).count(function (e, totalCount) {
            console.log("Studios search request total results length = " + totalCount);
            collection.find(searchRequest).skip(searchOptions.skip).limit(searchOptions.limit).sort(searchOptions.sort).toArray(function (e, docs) {
                var searchResult = {};
                searchResult.totalCount = totalCount;
                searchResult.records = docs;
                res.json(searchResult);
            });
        });
    }
    else {
        collection.find(searchRequest).sort(searchOptions.sort).toArray(function (e, docs) {
            console.log(docs.length);
            res.json(docs);
        });
    }
});

/* POST to save a new studio.*/
router.post('/savestudio', studioLimiter, auth, function (req, res) {

    console.log('/savestudio');
    console.log(req.body);

    var body = req.body;

    // Set our collection
    var collection = getCollection();

    if ((typeof body.name !== typeof undefined) && (body.name != '')) {
        if ((typeof body.lat !== typeof undefined) && !isNaN(body.lat)) {
            body.lat = Number(body.lat);
        }
        if ((typeof body.lon !== typeof undefined) && !isNaN(body.lon)) {
            body.lon = Number(body.lon);
        }
        collection.insert(body, function (err, result) {
            res.send(
                (err === null) ? { msg: '' } : { msg: err }
            );
        });
    } else {
        res.status(422).send("Undefined or empty studio name.")
    }
    

});

/*
 * DELETE a studio.
 */
router.delete('/deletestudio/', studioLimiter, auth, function (req, res) {

    console.log(req.query);

    // Set our collection
    var collection = getCollection();

    var studioToDelete = req.query.ID;

    console.log('req.query.ID = ' + studioToDelete);

    if (typeof studioToDelete === 'string') {
        collection.deleteOne({ '_id': new mongodb.ObjectID(studioToDelete) }, function (err, results) {
            res.send((err === null) ? { msg: '' } : { msg: 'error: ' + err });
        });
    } else {
        res.status(400).send("Incorrect type for studio ID.")
    }
});

/* POST to update an existing studio */
router.post('/updatestudio', studioLimiter, auth, function (req, res) {

    console.log('/updatestudio');
    console.log(req.body);

    var body = req.body;
    var id = body.ID;

    if (typeof id !== typeof undefined) {
        // Set our collection
        var collection = getCollection();

        var newFields = {}

        if (typeof body.name !== typeof undefined) {
            newFields.name = body.name;
        }
        if ((typeof body.lat !== typeof undefined) && !isNaN(body.lat)) {
            newFields.lat = Number(body.lat);
        }
        if ((typeof body.lon !== typeof undefined) && !isNaN(body.lon)) {
            newFields.lon = Number(body.lon);
        }

        collection.updateOne(
            { _id: new mongodb.ObjectID(id) },
            { $set: newFields },
            function (err, result) {
                res.send(
                    (err === null) ? { msg: '' } : { msg: err }
                );
            }
        );
    } else {
        res.status(400).send("Undefined studio ID.")
    }
});

function getCollection() {
    // Set our internal DB variable
    const db = MongoDBAccess.getDB();
    return db.collection('studios');
}

function getSortOptions(sortId) {
    var sortOptions;
    switch (sortId) {
        case '2':
            sortOptions = { name: -1 };
            break;
        default:
            sortOptions = { name: 1 };
            break;
    }
    return sortOptions;
}


module.exports = router;
