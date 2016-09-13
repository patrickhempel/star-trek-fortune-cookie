'use strict';
const express   = require('express');
const app       = express();
const cors      = require('express-cors');
const request   = require('request');
const _         = require('lodash');
const Q         = require('q');

const data = {
    'tos': 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Star_Trek:_The_Original_Series_episodes&cmlimit=500&format=json',
    'tng': 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Star_Trek:_The_Next_Generation_episodes&cmlimit=500&format=json',
    'dsn': 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Star_Trek:_Deep_Space_Nine_episodes&cmlimit=500&format=json',
    'voy': 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Star_Trek:_Voyager_episodes&cmlimit=500&format=json',
    'ent': 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Star_Trek:_Enterprise_episodes&cmlimit=500&format=json'
};

const startUpPromises = [];

_.map( Object.keys( data), k => {
    let defer = Q.defer();

    console.log( 'fetching episodes for ' + k );

    request( data[k], (error, response, body) => {
        var body = JSON.parse( body);
        data[k] = body.query.categorymembers;
        defer.resolve();
    });

    startUpPromises.push( defer.promise);
});


const startApp = () => {
    app.use( cors({
        allowedOrigins: [ 'localhost:*' ],
        headers: [ 'authorization' ]
    }));

    app.get( '/random', (req, res, next) => {
        let item = data.all[Math.floor(Math.random()*data.all.length)];

        fetchUrl( item.pageid)
            .then( ( fullUrl) => {
                let response = {
                    "text": item.title,
                    "attachments": [
                        {
                            "text": fullUrl
                        }
                    ]
                };

                return res.send( response);
            });


    });


    app.listen(3000, function() {
        console.log('Example app listening on port 3000!');
    });
};

const fetchUrl = pageid => {
    let defer = Q.defer();
    request(
        `https://en.wikipedia.org/w/api.php?action=query&prop=info&pageids=${pageid}&inprop=url&format=json`,
        (err, response, body) => {
            let data = JSON.parse( body);
            defer.resolve(data.query.pages[pageid].fullurl);
        }
    );

    return defer.promise;
};


Q.all( startUpPromises)
    .then( () => {
        let defer = Q.defer();

        data['all'] = _.reduce( data, (m, i) => m.concat(i));

        defer.resolve();

        return defer.promise;
    })
    .then( startApp)
    .catch( console.error);


