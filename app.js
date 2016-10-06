'use strict';
// Error Handling - Sentry
if (process.env.SENTRY_DSN) {
  console.log('Using sentry DSN', process.env.SENTRY_DSN);
  const raven = require('raven');
  const client = new raven.Client(process.env.SENTRY_DSN);
  client.patchGlobal();
}

const express = require('express');
const imageResizer      = require('.');

const app     = express();
const Img     = imageResizer.img;
const env     = imageResizer.env;
const streams = imageResizer.streams;

app.directory = __dirname;
imageResizer.expressConfig(app);

// Error Handling - Sentry
if (process.env.SENTRY_DSN) {
  const raven = require('raven');
  app.use(raven.middleware.express.requestHandler(process.env.SENTRY_DSN));
}

app.get('/favicon.ico', function (request, response) {
  response.sendStatus(404);
});

// Show supported modifiers
app.get('/modifiers.json', function (request, response) {
  response.json(imageResizer.modifiers);
});

if (env.development) {
  // Show a test page of the image options
  app.get('/test-page', function (request, response) {
    response.render('index.html');
  });

  // Show the environment variables and their current values
  app.get('/env', function (request, response) {
    response.json(env);
  });
}

// GET images
app.get('/*?', function (req, res, next) {
  if (req.path === '/') return next();

  const image = new Img(req);
  image.getFile()
    .pipe(new streams.identify())
    .pipe(new streams.normalize())
    .pipe(new streams.resize())
    .pipe(new streams.filter())
    .pipe(new streams.optimize())
    .pipe(streams.response(req, res));
});

// Error Handling - Sentry
if (process.env.SENTRY_DSN) {
  const raven = require('raven');
  app.use(raven.middleware.express.errorHandler(process.env.SENTRY_DSN));
}

// Error Handling - 404
app.use((req, res, next) => {
  const err = new Error('Not found');
  err.status = 404;
  next(err);
});

// Error Handling - JSON errors
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: err.message,
    stack: err.stack,
  });
});

const port = app.get('port');
app.listen(port, function () {
  console.log('Listening on port ', port);
});
