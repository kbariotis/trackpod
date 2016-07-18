'use strict';

const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const app = require('./index');

const port = process.env.PORT || 3000;

if (cluster.isMaster) {

  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });
}
