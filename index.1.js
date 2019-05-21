var needle = require('needle');
var tress = require('tress');
var cheerio = require('cheerio');
var fs = require('fs');

var URL = 'https://www.ferra.ru/ru/techlife/news/';
var resultsArray = [];
var LINKS = [];

var Nightmare = require('nightmare');

var nightmare = Nightmare({ show: true });

function getLinks(url) {
    return nightmare.goto(URL).evaluate(() => {
        var list = [];
        document.querySelectorAll('a.newslist__title').forEach(item => list.push(item.href));
        return list;
    });
}

async function main() {    
    const links = await getLinks(URL);

    const results = await resolvePageData(links);

    console.log(results);

    nightmare.end().then(() => {
        console.log('ended');
    });
}

let step = 0;

function start(cb) {
    return nightmare.goto(URL).evaluate(cb);
}

async function resolvePageData(urls) {
    return (await Promise.all(
        urls.map(getPageData)
    )).filter(x => x);
}

function getPageData(url) {
    return new Promise((resolve, reject) => {
        needle.get(url, (err, res, html) => {
            if(err) { reject(err); }    
            var $ = cheerio.load(html);
            if($('a.topicsource__source').text() == 'ВКонтакте'){
                console.log($('h1').text())
                resolve({name: $('h1').text()});
            } else {
                resolve(null);
            }
        });
    });
}

main();