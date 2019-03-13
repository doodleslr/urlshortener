const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();
const nanoid = require('nanoid');

const MongoClient = require('mongodb');
const databaseURL = 'mongodb://localhost:27017/';

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let db;
let collection;
MongoClient.connect(databaseURL, {useNewUrlParser: true}, (err, database) => {
    if(err){
        throw err;
    }
    
    app.listen(4100);

    db = database.db('urlshortener');
    collection = db.collection('urlshortener');

    if(!database){
        res.end('Database is not connected');
    }
});

app.post('/short', (req, res) => {
    let vanillaURL;
    try {
        vanillaURL = new URL(req.body.url);
    } catch (err) {
        return res.status(400).send({error: 'Invalid URL'});
    }
    dns.lookup(vanillaURL.hostname, (err) => {
        if(err) {
            return res.status(404).send({error: 'URL does not exist'});
        }

        collection.findOneAndUpdate(
            { original_url: vanillaURL.href },
                { 
                    $setOnInsert: {
                        original_url: vanillaURL.href,
                        shortID: nanoid(7),
                    },
                },
                {
                    upsert: true,
                    returnOriginal: false,
                }
        )
        .then(result => {
            const doc = result.value;
            res.json({
                original_url: doc.original_url,
                shortID: doc.shortID,
            });
        })
        .catch(console.error);
    });
});

app.get('/:shortID', (req, res) => {
    const queryShortID = req.params.shortID;
    collection.findOne(
        { shortID: queryShortID }
    )
    .then(idResult => {
        if(idResult === null) {
            return res.send('Sorry we could not find that link');
        }
        res.redirect(idResult.original_url);
    })
    .catch(console.error);
});