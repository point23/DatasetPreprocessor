// Module Alias
const express = require('express');
const Datastore = require('nedb');
const fs = require("fs");
const readline = require('readline');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const seedrandom = require('seedrandom');

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

app.post('/submit', async (request, response) => {
    let result = await request.body;

    console.log(result);

    let timestamp = Date.now();
    const permission = 0744;
    var prng = seedrandom(timestamp);

    const root = `assets\\src_${timestamp}\\`;
    await fs.mkdirSync(root, permission);

    const numDocumentsUsed = Number(result.numDocumentsUsed);
    const categoriesUsed = result.categoriesUsed;

    for (let category of categoriesUsed) {
        console.log(category);

        let selector = {category: category},
            options = {link: 1, _id: 0};

        const folder = root + `category-${category.toLowerCase()}\\`;
        await fs.mkdirSync(folder, permission);

        database.find(selector).projection(options).exec(async (err, objects) => {
            let shuffled = objects.sort((a, b) => { 0.5 - prng()});
            
            let numSucceed = 0;
            for (let i = 0; i < shuffled.length; i++) {
                let link = shuffled[i].link;

                const path = folder + `${numSucceed + 1}.txt`;
                let succeed = await fetchDocumentsAsync(path, link);

                console.warn(`succeed?: ${succeed}, ${numDocumentsUsed - numSucceed - 1} left`);
                if (succeed) {
                    numSucceed += 1;

                    if (numSucceed == numDocumentsUsed) 
                        break;
                }
            }
        });
    }

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

async function fetchDocumentsAsync(path, link) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
    console.log(`start to scrape page from: ${link}`);
        await page.goto(link);
        let selector = '#entry-body > section';

        const text = await page.$eval(selector, (el) => el.innerText);
        
        let tokens = text.split(/\W+/);

        console.log(text);
        console.log(tokens);

        let content = "";
        for (let i = 0; i < tokens.length; i++) {
            content += tokens[i];
            if (i % 10 == 0 && i != 0) {
                content += '\n'
            }
            else {
                content += ' ';
            }
        }

        fs.writeFile(path, content, err => {
            if (err) {
                // console.error(err);
            }
        });

        await browser.close();
    }
    catch(error) {
        
        // console.error(error);

        return false;
    }

    return true;
}