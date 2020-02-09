var express = require('express');
var router = express.Router();

// Load MongoDB utils
const MongoDBAccess = require('../db/dbaccess');

const fs = require('fs');

/* GET to Search Records Default Service */
router.get('/searchrecordsdefault/', function (req, res) {

    // Set our internal DB variable
    const db = MongoDBAccess.getDB();

    // Set our collection
    var collection = db.collection('soulfunk');

    var searchRequest = {};
    var limit;
    if (req.query.Limit != null) {
        limit = Number(req.query.Limit);
    }

    collection.find(searchRequest).limit(limit).sort([['Artist', 1]]).toArray(function (err, docs) {
        res.json(docs);
    });
});

/* GET to Search Records Service */
router.get('/searchrecords/', function (req, res) {

    console.log(req.query);

    // Set our internal DB variable
    const db = MongoDBAccess.getDB();

    // Set our collection
    var collection;

    if (req.query.Style === '2') {
        collection = db.collection('rap');
    }
    else if (req.query.Style === '3') {
        collection = db.collection('jazz');
    }
    else if (req.query.Style === '4') {
        collection = db.collection('soundtracks');
    }
    else if (req.query.Style === '5') {
        collection = db.collection('misc');
    }
    else if (req.query.Style === '6') {
        collection = db.collection('aor');
    }
    else if (req.query.Style === '7') {
        collection = db.collection('audiophile');
    }
    else {
        collection = db.collection('soulfunk');
    }

    var searchRequest = {};

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
    if (req.query.Sort === '2') {
        searchOptions.sort = { Artist: -1 };
    }
    else if (req.query.Sort === '3') {
        searchOptions.sort = { Year: 1 };
    }
    else if (req.query.Sort === '4') {
        searchOptions.sort = { Year: -1 };
    }
    else if (req.query.Sort === '5') {
        searchOptions.sort = { Title: 1 };
    }
    else if (req.query.Sort === '6') {
        searchOptions.sort = { Title: -1 };
    }
    else {
        searchOptions.sort = { Artist: 1 };
    }

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
router.post('/saverecord', function (req, res) {

    console.log('/saverecord');
    console.log(req.body);

    // Set our internal DB variable
    const db = MongoDBAccess.getDB();

    // Set our collection
    var collection = db.collection('soulfunk');
    var body = req.body;

    if (body.Style === '2') {
        collection = db.collection('rap');
    }
    else if (body.Style === '3') {
        collection = db.collection('jazz');
    }
    else if (body.Style === '4') {
        collection = db.collection('soundtracks');
    }
    else if (body.Style === '5') {
        collection = db.collection('misc');
    }
    else if (body.Style === '6') {
        collection = db.collection('aor');
    }
    else if (body.Style === '7') {
        collection = db.collection('audiophile');
    }

    if (!isNaN(body.Year)) {
        body.Year = Number(body.Year);
    }

    collection.insert(body, function (err, result) {
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

function detectNumeric(obj) {
    for (var index in obj) {
        if (!isNaN(obj[index])) {
            obj[index] = Number(obj[index]);
        } else if (typeof obj === "object") {
            detectNumeric(obj[index]);
        }
    }
}

/*
 * DELETE to deleterecord.
 */
router.delete('/deleterecord/', function (req, res) {
    // @ts-ignore
    var db = req.dbRecords;
    // Set our collection
    var collection;

    if (req.query.Style === '2') {
        collection = db.get('rap');
    }
    else if (req.query.Style === '3') {
        collection = db.get('jazz');
    }
    else if (req.query.Style === '4') {
        collection = db.get('soundtracks');
    }
    else if (req.query.Style === '5') {
        collection = db.get('misc');
    }
    else if (req.query.Style === '6') {
        collection = db.get('aor');
    }
    else if (req.query.Style === '7') {
        collection = db.get('audiophile');
    }
    else {
        collection = db.get('soulfunk');
    }

    var recordToDelete = req.query.ID;

    console.log('req.query.ID = ' + recordToDelete);

    collection.findOne({ '_id': recordToDelete }, function (err, doc) {
        if (!err) {
            if (doc.ImageFileName !== '') {
/*                var filePath = 'public/uploads/'+doc.ImageFileName;
                console.log('filePath = ' + filePath);
                fs.access(filePath, error => {
                    if (!error) {
                        fs.unlinkSync(filePath);
                    } else {
                        console.log(error);
                    }
                });
*/            }
        }
    });

    collection.remove({ '_id': recordToDelete }, function (err) {
        res.send((err === null) ? { msg: '' } : { msg: 'error: ' + err });
    });
});

/* POST to update an existing record */
router.post('/updaterecord', function (req, res) {

    console.log('/updaterecord');
    console.log(req.body);

    // @ts-ignore
    var db = req.dbRecords;
    var collection = db.get('soulfunk');
    var body = req.body;
    var id = body.ID;

    if (body.Style === '2') {
        collection = db.get('rap');
    }
    else if (body.Style === '3') {
        collection = db.get('jazz');
    }
    else if (body.Style === '4') {
        collection = db.get('soundtracks');
    }
    else if (body.Style === '5') {
        collection = db.get('misc');
    }
    else if (body.Style === '6') {
        collection = db.get('aor');
    }
    else if (body.Style === '7') {
        collection = db.get('audiophile');
    }

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
        'Reference': body.Reference
    }

    collection.update(
        { _id: id },
        { $set: newFields },
        function (err, result) {
            res.send(
                (err === null) ? { msg: '' } : { msg: err }
            );
        }
    );
});

module.exports = router;
