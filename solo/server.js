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

MongoClient.connect(databaseURL, {useNewUrlParser: true}, (err, database) => {
    if(err){
        throw err;
    }
    app.locals.db = database.db('urlshortener');
    if(!database){
        console.log('Database is not connected');
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
        let dbApp = req.app.locals;//stuck here because it's being a cunt and .open isn't a function which is utter fucken bullshit
        dbApp.open(( db, url) => {
            var collection = db.collection('shortenedURLs');
            return collection.update(
                { original_url: url },
                {   
                    $setOnInsert: {
                        original_url: url,
                        shortId: nanoid(7),
                    },
                },
                { 
                    upsert: true, 
                    returnOriginal: false,
                },
            );
        })
        .then(result => {
            const doc = result.value;
            res.json({
                original_url: doc.original_url,
                shortId: doc.shortId,
            });
        })
        .catch(console.error);
    });
});

app.listen(4100);