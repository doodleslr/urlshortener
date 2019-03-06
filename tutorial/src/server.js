
const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const nanoid = require('nanoid');

const databaseUrl = 'mongodb://localhost:27017';

const MongoClient = require('mongodb');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

MongoClient.connect(databaseUrl, { useNewUrlParser: true })
  .then(client => {
    app.locals.db = client.db('shortener');
  })
  .catch(() => console.error('Failed to connect to the database'));

const shortenURL = (db, url) => {
    const shortenedURLs = db.collection('shortenedURLs');
    return shortenedURLs.findOneAndUpdate({original_url: url},
        {
            $setOnInsert:{
                original_url: url,
                short_id: nanoid(7),
            },
        },
        {
            returnOriginal: false,
            upsert: true,
        });
};
const checkIfShortIdExists = (db, code) => db.collection('shortenedURLs')
    .findOne({short_id: code});

app.get('/', (req, res)=>{
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(htmlPath);
});

app.set('port', process.env.port || 4100);
const server = app.listen(app.get('port'), ()=>{
    console.log(`Express running PORT ${server.address().port}`);
});

app.post('/new', (req, res) => {
    let originalURL;
    try{
        originalURL = new URL(req.body.url);
    } catch (err) {
        return res.status(400).send({error: 'invalid URL'});
    }

    dns.lookup(originalURL.hostname, (err) => {
        if (err) {
            return res.status(404).send({error: 'URL does not exist'});
        }

        const {db} = req.app.locals;
        shortenURL(db, originalURL.href)
            .then(result => {
                const doc = result.value;
                res.json({
                    original_url: doc.original_url,
                    short_id: doc.short_id,
                });
            })
        .catch(console.error);
    })
});

app.get('/:short_id', (req, res) => {
    const shortId = req.params.short_id;
    const { db } = req.app.locals;

    checkIfShortIdExists(db, shortId)
        .then(doc => {
            if (doc === null) return res.send('Sorry we could not find that link');
            
            res.redirect(doc.original_url)
        })
        .catch(console.error);
});