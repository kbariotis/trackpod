/*jslint node: true */

'use strict';

var https = require('https');
var ua = require('universal-analytics');
var express = require('express');
var config = require('config');

var visitor = ua(config.get('ga.tracker_id'), {
  https: true
}); //.debug();

var app = express();

app.get(`/healthcheck`, (req, res) => {
  res.json({});
});

app.get(`/${config.get('proxy.path')}/:podcast`, (req, res) => {

  visitor.event('Podcasts', 'Play', req.params.podcast).send();

  var options = {
    hostname: config.get('proxy.source'),
    port: 443,
    path: req.url,
    method: 'GET'
  };

  var proxy = https.request(options, (awsResponse) => {

      var body = [];
      var contentLength = parseInt(awsResponse.headers['content-length']);
      var dataLength = 0;

      awsResponse.on('data', (chunk) => {

        dataLength += chunk.length;

        if (dataLength >= contentLength) {
          visitor.event('Podcasts', 'Full Play', req.params.podcast).send();
        }
      });

      awsResponse.pipe(res);
  });

  proxy.on('error', (e) => {
    console.log(e);
    console.log(e.stack);
    console.log(`problem with request: ${e.message}`);
  });

  req.pipe(proxy);

});

module.exports = app;
