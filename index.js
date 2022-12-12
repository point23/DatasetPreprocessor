// Module Alias
const express = require('express');
const Datastore = require('nedb');
const fs = require("fs");
const readline = require('readline');
const fetch = require('node-fetch');

// Init express app
const app = express();
app.use(express.json({limit: '1mb'}));
app.use(express.static('public'));
app.listen(3000, () => { 
    console.log('listen at 3000'); 
})

const database = new Datastore('database.db');
database.loadDatabase();

app.get('/load', (request, response) => {
    database.find({}, (error, docs) => {
        let numCategories = 0;
        var categories = [];
        var counts = {};
        var examples = {};

        for (let doc of docs) {
            if (counts[doc.category] == undefined) {
                counts[doc.category] = 1;
                numCategories += 1;
                categories.push(doc.category);
                examples[doc.category] = doc.link;
            }
            else {
                counts[doc.category] += 1;
            }
        }

        response.json({
            counts: counts,
            categories: categories,
            examples: examples,
            numCategories: numCategories,
            numDocuments: docs.length,
        });
    });
});

app.post('/update', (request, response) => {
    loadDatabaseAsync = async function() {
        const fileStream = fs.createReadStream('news.json');
        const lineReader = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
    
        for await (const line of lineReader) {
            let document = JSON.parse(line);
            database.insert(document);
        }
    }

    database.remove();
    loadDatabaseAsync();

    response.json({
        status: 'success',
    });
});