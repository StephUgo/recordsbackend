var express = require('express');
var mongodb = require('mongodb');
var router = express.Router();
var _ = require('lodash');

// Load MongoDB utils
const MongoDBAccess = require('../db/dbaccess');

const fs = require('fs');
const auth = require('../auth/middleware/auth.service');

// set up rate limiter: maximum of 50 requests per minute
const RateLimit = require('express-rate-limit');
const recordsLimiter = RateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 500, // max requests per windowMs 
  message: "Keep quiet, maybe get a life instead of spamming the api.",
  headers: true
});


/* GET to Search Records Default Service */
router.get('/searchrecordsdefault/', recordsLimiter, auth, function (req, res) {

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
router.get('/searchrecords/', recordsLimiter, auth, function (req, res) {

    console.log(req.query);

    // Set our collection
    var collection = getCollection();

    var searchRequest = {};

    // Set search criterion
    setStyleFromId(req.query.Style, searchRequest);

    if ((typeof req.query.Artiste !== typeof undefined) && (req.query.Artiste != '')) {
        // @ts-ignore
        let safeArtiste = _.escapeRegExp(req.query.Artiste);
        searchRequest.Artist = { $regex: new RegExp('.*' + safeArtiste + '.*', 'i') };
    }
    if ((typeof req.query.Titre !== typeof undefined) && (req.query.Titre != '')) {
        // @ts-ignore
        let safeTitre = _.escapeRegExp(req.query.Titre);
        searchRequest.Title = { $regex: new RegExp('.*' + safeTitre + '.*', 'i') };
    }
    if ((typeof req.query.Format !== typeof undefined) && (req.query.Format != '')) {
        // @ts-ignore
        let safeFormat = _.escapeRegExp(req.query.Format);
        searchRequest.Format = { $regex: new RegExp('.*' + safeFormat + '.*', 'i') };
    }
    if ((typeof req.query.Label !== typeof undefined) && (req.query.Label != '')) {
        // @ts-ignore
        let safeLabel = _.escapeRegExp(req.query.Label);
        searchRequest.Label = { $regex: new RegExp('.*' + safeLabel + '.*', 'i') };
    }
    if ((typeof req.query.Country !== typeof undefined) && (req.query.Country != '')) {
        // @ts-ignore
        let safeCountry = _.escapeRegExp(req.query.Country);
        searchRequest.Country = { $regex: new RegExp('.*' + safeCountry + '.*', 'i') };
    }
    if ((typeof req.query.Period !== typeof undefined) && (req.query.Period != '')) {
        // @ts-ignore
        let  safePeriod = _.escapeRegExp(req.query.Period);
        searchRequest.Period = { $regex: new RegExp('.*' + safePeriod + '.*', 'i') };
    }
    if ((typeof req.query.Reference !== typeof undefined) && (req.query.Reference != '')) {
        // @ts-ignorerecordsLimiter
        let safeReference = _.escapeRegExp(req.query.Reference);
        searchRequest.Reference = { $regex: new RegExp('.*' + safeReference + '.*', 'i') };
    }
    if ((typeof req.query.StorageLocation !== typeof undefined) && (req.query.StorageLocation != '')) {
        // @ts-ignore
        let safeStorageLocation = _.escapeRegExp(req.query.StorageLocation);
        searchRequest.storageLocation = { $regex: new RegExp('.*' + safeStorageLocation + '.*', 'i') };
    }
    if ((typeof req.query.Year !== typeof undefined) && (req.query.Year != '')) {
        searchRequest.Year = Number(req.query.Year);
    }
    if ((typeof req.query.Keywords === 'string' || req.query.Keywords instanceof String) && (req.query.Keywords != '')) {
        let reqKeywords = req.query.Keywords.split(';');
        let safeKeyword;
        if (reqKeywords.length > 1) {
            let regexKeywords = [];
            reqKeywords.forEach(element => {
                safeKeyword = _.escapeRegExp(element);
                regexKeywords.push({keywords: { $regex: new RegExp('.*' + safeKeyword + '.*', 'i') }});
            });
            searchRequest.$and = regexKeywords ;
        } else {
            safeKeyword = _.escapeRegExp(reqKeywords[0]);
            searchRequest.keywords = { $regex: new RegExp('.*' + safeKeyword + '.*', 'i') };
        }
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
router.post('/saverecord', recordsLimiter, auth, function (req, res) {

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
router.delete('/deleterecord/', recordsLimiter, auth, function (req, res) {

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

    if (typeof recordToDelete === 'string') {
        collection.deleteOne({ '_id': new mongodb.ObjectID(recordToDelete) }, function (err, results) {
            res.send((err === null) ? { msg: '' } : { msg: 'error: ' + err });
        });
    }
});

/* POST to update an existing record */
router.post('/updaterecord', recordsLimiter, auth, function (req, res) {

    console.log('/updaterecord');
    console.log(req.body);

    var body = req.body;
    var id = body.ID;

    // Set our collection
    var collection = getCollection();

    if (!isNaN(body.Year)) {
        body.Year = Number(body.Year);
    }
    
    // Update style from Id to String
    setStyleFromId(body.Style, body);

    var newFields = {
        'Style': (typeof body.Style !== typeof undefined) ? body.Style : null,
        'Artist': (typeof body.Artist !== typeof undefined) ? body.Artist : null,
        'Title': (typeof body.Title !== typeof undefined) ? body.Title : null,
        'Format': (typeof body.Format !== typeof undefined) ? body.Format : null,
        'Label': (typeof body.Label !== typeof undefined) ? body.Label : null,
        'Country': (typeof body.Country !== typeof undefined) ? body.Country : null,
        'Year': (typeof body.Year !== typeof undefined) ? body.Year : null,
        'Period': (typeof body.Period !== typeof undefined) ? body.Period : null,
        'Comments': (typeof body.Comments !== typeof undefined) ? body.Comments : null,
        'ImageFileName': (typeof body.ImageFileName !== typeof undefined) ? body.ImageFileName : null,
        'Reference': (typeof body.Reference !== typeof undefined) ? body.Reference : null,
        'keywords': (typeof body.keywords !== typeof undefined) ? body.keywords : null,
        'additionalPics': (typeof body.additionalPics !== typeof undefined) ? body.additionalPics : null,
        'audioSamples': (typeof body.audioSamples !== typeof undefined) ? body.audioSamples : null,
        'storageLocation': (typeof body.storageLocation !== typeof undefined) ? body.storageLocation : null
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


/* POST to update keywords on a set of existing record */
router.post('/updatekeywords', recordsLimiter, auth, function (req, res) {

    console.log('/updatekeywords');
    console.log(req.body);

    var body = req.body;
    if (!Array.isArray(body)) {
        return res.status(400).send("updatekeywords post content shall be provided within an array.");
    }
    // Set our collection
    var collection = getCollection();

    var allDbUpdateRequest = [];
    body.forEach((bodyItem) => {
        allDbUpdateRequest.push(updateKeywordsForOneDocument(collection, bodyItem));
    });
    Promise.all(allDbUpdateRequest).then(function (results) {
        res.send({ msg: 'Keywords updated.' } );
    }).catch(function (err) {
        console.log('One failure at least occurred in the keywords update: ' + err); //failure callback(if any one request got rejected)
        res.send({ msg: 'One failure at least occurred in the keywords update.' } );
    });
});

function updateKeywordsForOneDocument(collection, bodyItem) {
    var id = bodyItem.ID;
    var newFields = {
        'keywords': (typeof bodyItem.keywords !== typeof undefined) ? bodyItem.keywords : null
    }

    return collection.updateOne(
        { _id: new mongodb.ObjectID(id) },
        { $set: newFields });
}

/* POST to update a set of existing records */
router.post('/updaterecords', recordsLimiter, auth, function (req, res) {

    console.log('/updaterecords');
    console.log(req.body);

    var body = req.body;
    if (!Array.isArray(body)) {
        return res.status(400).send("updaterecords post content shall be provided within an array.");
    }
    // Set our collection
    var collection = getCollection();

    var allDbUpdateRequest = [];
    body.forEach((bodyItem) => {
        allDbUpdateRequest.push(updateOneRecord(collection, bodyItem));
    });
    Promise.all(allDbUpdateRequest).then(function (results) {
        res.send({ msg: 'Records updated.' } );
    }).catch(function (err) {
        console.log('One failure at least occurred in the records update: ' + err); //failure callback(if any one request got rejected)
        res.send({ msg: 'One failure at least occurred in the records update.' } );
    });
});

function updateOneRecord(collection, bodyItem) {
    var id = bodyItem.ID;

    if (!isNaN(bodyItem.Year)) {
        bodyItem.Year = Number(bodyItem.Year);
    }
    
    // Update style from Id to String
    setStyleFromId(bodyItem.Style, bodyItem);

    var newFields = {
        'Style': (typeof bodyItem.Style !== typeof undefined) ? bodyItem.Style : null,
        'Artist': (typeof bodyItem.Artist !== typeof undefined) ? bodyItem.Artist : null,
        'Title': (typeof bodyItem.Title !== typeof undefined) ? bodyItem.Title : null,
        'Format': (typeof bodyItem.Format !== typeof undefined) ? bodyItem.Format : null,
        'Label': (typeof bodyItem.Label !== typeof undefined) ? bodyItem.Label : null,
        'Country': (typeof bodyItem.Country !== typeof undefined) ? bodyItem.Country : null,
        'Year': (typeof bodyItem.Year !== typeof undefined) ? bodyItem.Year : null,
        'Period': (typeof bodyItem.Period !== typeof undefined) ? bodyItem.Period : null,
        'Comments': (typeof bodyItem.Comments !== typeof undefined) ? bodyItem.Comments : null,
        'ImageFileName': (typeof bodyItem.ImageFileName !== typeof undefined) ? bodyItem.ImageFileName : null,
        'Reference': (typeof bodyItem.Reference !== typeof undefined) ? bodyItem.Reference : null,
        'keywords': (typeof bodyItem.keywords !== typeof undefined) ? bodyItem.keywords : null,
        'additionalPics': (typeof bodyItem.additionalPics !== typeof undefined) ? bodyItem.additionalPics : null,
        'audioSamples': (typeof bodyItem.audioSamples !== typeof undefined) ? bodyItem.audioSamples : null,
        'storageLocation': (typeof bodyItem.storageLocation !== typeof undefined) ? bodyItem.storageLocation : null
    }


    return collection.updateOne(
        { _id: new mongodb.ObjectID(id) },
        { $set: newFields });
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
        case '22':
            parentObject.Style = "Funky French";
            break;
        case '23':
            parentObject.Style = "Pop";
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
