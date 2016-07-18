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

var handleResponse = (req, res, visitor) => {

  return (proxyResponse) => {

    var body = [];
    var contentLength = parseInt(proxyResponse.headers['content-length']);

    proxyResponse.on('data', (chunk) => {
      body.push(chunk);
      var currentLength = JSON.stringify(body).replace(/[\[\]\,\"]/g,'').length;

      if (currentLength >= contentLength) {
        visitor.event('Podcasts', 'Full Play', req.params.podcast).send();
      }
    });

    proxyResponse.on('close', () => {
      console.log('end');
    });

    proxyResponse.pipe(res, {
      end: true
    });

  };
};

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

  var proxy = https.request(options, handleResponse(req, res, visitor));

  req.pipe(proxy, {
    end: true
  });

});

module.exports = app;
