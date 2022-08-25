//app.js
//web app service routines

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//required modules
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');
var util = require('util');
var querystring = require('querystring');
var server = require('./js/server')

//establishing routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//instantiation of app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app config
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'streams')));
app.use(express.static(path.join(__dirname, '/../../../data2/ftps'))); //set to /../../../data2/ftps on return

//applying routes to app
app.use('/', indexRouter);
app.use('/users', usersRouter);

//additional config for json
app.use(bodyParser.json());

//promisify directory read function
const readDir = util.promisify(fs.readdir)

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//route called to populate list of live streams in live stream select element
app.get('/live_streams', (req, res) => {
  server.getLive()
  .then((tuple) => {
    var optionList = tuple[0];
    var rawList = tuple[1];
    res.json(tuple);
    return [optionList, rawList];
  })//then
  .catch((e) => {
    console.log(e);
    var error = new Error('Server failure while getting live streams.');
    res.send(error);
  });//catch
});//app.get

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//route called to populate list of historical streams in historical stream
app.get('/hist_streams', (req, res) => {
  server.getHist()
  .then((optionList) => {
    return res.json(optionList);
  })//then
  .catch((e) => {
    console.log(e);
    var error = new Error('Server failure while getting historical streams.');
    res.send(error);
  })//catch
});//app.get

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//route called with enc query string to populate list of historical dates associated
//with a particular stream
app.get('/get_dates', (req, res) => {
  let opt = req.query.opt;
  let enc = req.query.enc;
  server.getDates(opt, enc)
  .then((optionList) => {
    return res.json(optionList);
  })//then
  .catch((e) => {
    console.log(e);
    var error = new Error('Server failure while getting historical dates.');
    res.send(error);
  })//catch
})//app.get

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//route called with enc query and date string to populate list of historical times associated
//with a particular stream and date
app.get('/get_times', (req, res) => {
  let opt = req.query.opt;
  let enc = req.query.enc;
  let date = req.query.date;
  server.getTimes(opt, enc, date)
  .then((optionList) => {
    return res.json(optionList);
  })//then
  .catch((e) => {
    console.log(e)
    var error = new Error('Server failure while getting historical times.');
    res.send(error);
  })//catch
})//app.get

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

app.get('/rooms', (req, res) => {
  server.getRooms()
  .then((roomList) => {
    return res.json(roomList)
  })//then
  .catch((e) => {
    console.log(e)
    var error = new Error('Server failure while getting TAG rooms.');
    res.send(error);
  })//catch
})//app.get

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

app.get('/live_enc', (req, res) => {
    let srv = req.query.srv;
    let enc = req.query.enc;
    server.getLiveEnc(srv, enc)
    .then((encoder) => {
        return res.json(encoder)
    })//then
    .catch((e) => {
        console.log(e)
        var error = new Error('Server failure while locating live encoder.');
        res.send(error);
    })//catch
})//app.get

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

app.get('/dl', (req, res) => {
    let start = req.query.start;
    let end = req.query.end;
    let strm = req.query.strm;
    let serv = req.query.serv;
    server.getTS(start, end, strm, serv)
    .then((a) => {
      return res.json(a);
    })//then
    .catch((e) => {
        console.log(e);
        var error = new Error('Server failure while retrieving .ts file.');
        res.send(error);
    })//catch
})//app.get

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

module.exports = app;
