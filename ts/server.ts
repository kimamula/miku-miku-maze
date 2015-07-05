'use strict';

import express = require('express');
import fs = require('fs');
import React = require('react');
import App = require('./components/app');

var app = express(), indexPage: string;

app.use(express.static(__dirname + '/../public'));

fs.readFile('index.html', 'utf8', (error: NodeJS.ErrnoException, buffer: Buffer) => {
  if (error) {
    throw new Error(error.message);
  }
  indexPage = buffer.toString().replace('{contents}', React.renderToString(React.createElement(App.component, null)));
});

app.get('/', (req: express.Request, res: express.Response) => {
    res.send(indexPage);
});

var port = process.env.PORT || 9000;
console.log('listening...' + port);
app.listen(port);
