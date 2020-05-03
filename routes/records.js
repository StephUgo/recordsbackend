var express = require('express');
var mongodb = require('mongodb');
var router = express.Router();

// Load MongoDB utils
const MongoDBAccess = require('../db/dbaccess');

const fs = require('fs');
const auth = require('../auth/middleware/auth.service');

/* GET to Search Records Default Service */
router.get('/searchrecordsdefault/',  auth, function (req, res) {

    // Set our collection
    var collection = getCollection();

    var searchRequest = {};
    var limit;
    if (req.query.Limit != null) {
        limit = Number(req.query.Limit);
    }

    collection.find(searchRequest).limit(limit).sort([['Artist', 1]]).toArray(function (err, docs) {
        res.json(docs);
    });
});

/* GET to Search Records Service (NB: this route require authentication) */
router.get('/searchrecords/', auth, function (req, res) {

    console.log(req.query);

    // Set our collection
    var collection = getCollection();

    var searchRequest = {};

    // Set search criterion
    setStyleFromId(req.query.Style, searchRequest);

    if ((typeof req.query.Artiste != 'undefined') && (req.query.Artiste != '')) {
        searchRequest.Artist = { $regex: new RegExp('.*' + req.query.Artiste + '.*', 'i') };
    }
    if ((typeof req.query.Titre != 'undefined') && (req.query.Titre != '')) {
        searchRequest.Title = { $regex: new RegExp('.*' + req.query.Titre + '.*', 'i') };
    }
    if ((typeof req.query.Format != 'undefined') && (req.query.Format != '')) {
        searchRequest.Format = { $regex: new RegExp('.*' + req.query.Format + '.*', 'i') };
    }
    if ((typeof req.query.Label != 'undefined') && (req.query.Label != '')) {
        searchRequest.Label = { $regex: new RegExp('.*' + req.query.Label + '.*', 'i') };
    }
    if ((typeof req.query.Country != 'undefined') && (req.query.Country != '')) {
        searchRequest.Country = { $regex: new RegExp('.*' + req.query.Country + '.*', 'i') };
    }
    if ((typeof req.query.Period != 'undefined') && (req.query.Period != '')) {
        searchRequest.Period = { $regex: new RegExp('.*' + req.query.Period + '.*', 'i') };
    }
    if ((typeof req.query.Year != 'undefined') && (req.query.Year != '')) {
        searchRequest.Year = Number(req.query.Year);
    }

    var searchOptions = {};
    searchOptions.sort = getSortOptions(req.query.Sort);

    if (req.query.Limit != null) {
        searchOptions.limit = Number(req.query.Limit);
    }
    if (req.query.Skip != null) {
        searchOptions.skip = Number(req.query.Skip);
    }

    console.log(searchRequest);

    if (req.query.Limit != null || req.query.Skip != null) {
        collection.find(searchRequest).count(function (e, totalCount) {
            console.log("Search request total results length = " + totalCount);
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

/* POST to save a new record.*/
router.post('/saverecord',  auth, function (req, res) {

    console.log('/saverecord');
    console.log(req.body);

    var body = req.body;

    // Set our collection
    var collection = getCollection();

    // Update style from Id to String
    setStyleFromId(body.Style, body);

    if (!isNaN(body.Year)) {
        body.Year = Number(body.Year);
    }

    collection.insert(body, function (err, result) {
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

/*
 * DELETE to deleterecord.
 */
router.delete('/deleterecord/',  auth, function (req, res) {

    console.log(req.query);

    // Set our collection
    var collection = getCollection();

    var recordToDelete = req.query.ID;

    console.log('req.query.ID = ' + recordToDelete);

    /*    collection.findOne({ '_id': recordToDelete }, function (err, doc) {
            if (!err) {
                if (doc.ImageFileName !== '') {
                    var filePath = 'public/uploads/'+doc.ImageFileName;
                    console.log('filePath = ' + filePath);
                    fs.access(filePath, error => {
                        if (!error) {
                            fs.unlinkSync(filePath);
                        } else {
                            console.log(error);
                        }
                    });
                }
            }
        });*/

    collection.deleteOne({ '_id': new mongodb.ObjectID(recordToDelete) }, function (err, results) {
        res.send((err === null) ? { msg: '' } : { msg: 'error: ' + err });
    });
});

/* POST to update an existing record */
router.post('/updaterecord',  auth, function (req, res) {

    console.log('/updaterecord');
    console.log(req.body);

    var body = req.body;
    var id = body.ID;

    // Set our collection
    var collection = getCollection();

    if (!isNaN(body.Year)) {
        body.Year = Number(body.Year);
    }

    var newFields = {
        'Artist': body.Artist,
        'Title': body.Title,
        'Format': body.Format,
        'Label': body.Label,
        'Country': body.Country,
        'Year': body.Year,
        'Period': body.Period,
        'Comments': body.Comments,
        'ImageFileName': body.ImageFileName,
        'Reference': body.Reference,
        'keywords': body.keywords
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
});

function getCollection(styleId) {
    // Set our internal DB variable
    const db = MongoDBAccess.getDB();
    return db.collection('records');
}

function setStyleFromId(styleId, parentObject) {

    switch (styleId) {
        case '1':
            parentObject.Style = "Soul/Funk";
            break;
        case '2':
            parentObject.Style = "Rap";
            break;
        case '3':
            parentObject.Style = "Jazz";
            break;
        case '4':
            parentObject.Style = "Soundtracks";
            break;
        case '5':
            parentObject.Style = "Misc";
            break;
        case '6':
            parentObject.Style = "AOR";
            break;
        case '7':
            parentObject.keywords = "Audiophile";
            break;
        case '8':
            parentObject.Style = "Latin";
            break;
        case '9':
            parentObject.Style = "African";
            break;
        case '10':
            parentObject.Style = "Island";
            break;
        case '11':
            parentObject.Style = "Hawaii";
            break;
        case '12':
            parentObject.Style = "Classical";
            break;
        case '13':
            parentObject.Style = "Spiritual Jazz";
            break;
        case '14':
            parentObject.Style = "Rock";
            break;
        case '15':
            parentObject.Style = "Reggae";
            break;
        case '16':
            parentObject.Style = "Library";
            break;
        case '17':
            parentObject.Style = "European";
            break;
        case '18':
            parentObject.Style = "Brazilian";
            break;
        case '19':
            parentObject.Style = "Japanese";
            break;
        case '20':
            parentObject.Style = "Electro";
            break;
        case '21':
            parentObject.Style = "Brit Funk";
            break;
    }
}


function getSortOptions(sortId) {
    var sortOptions;
    switch (sortId) {
        case '2':
            sortOptions = { Artist: -1 };
            break;
        case '3':
            sortOptions = { Year: 1 };
            break;
        case '4':
            sortOptions = { Year: -1 };
            break;
        case '5':
            sortOptions = { Title: 1 };
            break;
        case '6':
            sortOptions = { Title: -1 };
            break;
        case '7':
            sortOptions = { Format: 1 };
            break;
        case '8':
            sortOptions = { Format: -1 };
            break;
        case '9':
            sortOptions = { Label: 1 };
            break;
        case '10':
            sortOptions = { Label: -1 };
            break;
        case '11':
            sortOptions = { Country: 1 };
            break;
        case '12':
            sortOptions = { Country: -1 };
            break;
        case '13':
            sortOptions = { Period: 1 };
            break;
        case '14':
            sortOptions = { Period: -1 };
            break;
        default:
            sortOptions = { Artist: 1 };
            break;
    }
    return sortOptions;
}

function detectNumeric(obj) {
    for (var index in obj) {
        if (!isNaN(obj[index])) {
            obj[index] = Number(obj[index]);
        } else if (typeof obj === "object") {
            detectNumeric(obj[index]);
        }
    }
}

module.exports = router;
