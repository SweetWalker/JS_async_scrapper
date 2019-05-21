var Nightmare = require('nightmare');
var needle = require('needle');
var vo = require('vo');
var cheerio = require('cheerio');
var fs = require('fs');

var nightmare = new Nightmare({ show: false });

var startTime;
var endTime;
var resultsArray = [];
var URL = 'https://www.ferra.ru/ru/techlife/news/';

function mainVO() {
    vo(runner)(function(error) {
        if(error) throw error;
    });
}

function * runner() {
    startTime = Date.now();
    let running = true;
    yield nightmare.goto(URL);
    
    while(running) {
        const links = yield nightmare.evaluate(() => {
            var list = [];
            document.querySelectorAll('a.newslist__title').forEach(item => list.push(item.href));
            
            var $linksContainer = document.querySelector('.newslist__body');
            var $links = document.querySelectorAll('.newslist__item');
            $links.forEach(i => $linksContainer.removeChild(i));
               
            document.querySelector('.js-load-more').click();
            return list;
        });

        const data = yield resolvePageData(links);

        resultsArray = resultsArray.concat(data);

        running = yield nightmare.wait(500).evaluate(() => {
            var news = document.querySelectorAll('a.newslist__title');
            return Boolean(news.length);
        });
    }

    yield nightmare.end();
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
                resolve({
                    name: $('h1').text(),
                    date: $('time.topic-about__date').text()
                });
            } else {
                resolve(null);
            }
        });
    });
}

mainVO();

function exitHandler(options, err) {
    endTime = Date.now();
    fs.writeFileSync('./data.json', JSON.stringify({
        time: (endTime - startTime)/1000/60,
        data: resultsArray
    }, null, 4));
}

process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));