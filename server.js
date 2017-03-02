var express = require('express');
var path = require('path');
var app = express();
require('dotenv').load();

var db_url = process.env.MONGOURL || "mongodb://localhost:27017/learnyoumongo";
var mongo = require('mongodb').MongoClient;

app.use(express.static(path.resolve(__dirname, 'client')));

mongo.connect(db_url, function(err, db) {
  if (err) throw err;

  //show index page
  app.get('/', function(req, res) {
    res.render('index');
  });
  
  app.get('/:short_code', function(req, res) {
    var short_code = req.params.short_code;
    // original and short code from db
    db.collection('sites').findOne(
      {"short_url": short_code}, 
      [], 
      function(err, doc) {
        if (err) throw err;
        if(doc){
          // redirect to original site
          return res.redirect(doc.original_url);
        }
        else{
          // url invalid
          return res.json({'error' : 'Invalid short url'});
        }
    });
  });
  
  app.get('/new/:url*', function(req, res) {
    var original_url = req.url.slice(5); // remove '/new/'
    if (validateUrl(original_url, res)) {
      //return url from db
      db.collection('sites').findOne(
        {"original_url": original_url}, 
        [], 
        function(err, doc) {
          if (err) throw err;
          if(doc){
            return res.json({
                'original_url' : doc.original_url, 
                'short_url' : (process.env.HOST_URL||"")  + doc.short_url
              });
          }else {
            //automically increment and return the seq value
            db.collection("counters").findAndModify(
              { _id: "count" },
              [],
              { $inc: { seq: 1 }},
              {upsert: true, new: true },
              function(err, doc) {
                if(err) throw err;
                var next = doc.value.seq;
                //Use next sequence value during insertion.
                db.collection("sites").insert(
                  {_id: next,
                  'original_url': original_url,
                  'short_url': next.toString()}, 
                  function(err, data) {
                    if (err) throw err;
                    // return short_url and original_url
                    return res.json({
                        'original_url' : data.ops[0].original_url, 
                        'short_url' : (process.env.HOST_URL||"") + data.ops[0].short_url
                      });
                  });
              });
          }
        });
    } else {
      // url invalid
      return res.json({'error' : 'Invalid Url'});
    }
  });

  /*
   Takes a url and returns true if valid else false
  */
  function validateUrl(url) {
    // Use @diegoperini's url validator from
    // https://gist.github.com/dperini/729294
    var regex = new RegExp(
      "^" +
      // protocol identifier
      "(?:(?:https?|ftp)://)" +
      // user:pass authentication
      "(?:\\S+(?::\\S*)?@)?" +
      "(?:" +
      // IP address exclusion
      // private & local networks
      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
      "|" +
      // host name
      "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
      // domain name
      "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
      // TLD identifier
      "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
      // TLD may end with dot
      "\\.?" +
      ")" +
      // port number
      "(?::\\d{2,5})?" +
      // resource path
      "(?:[/?#]\\S*)?" +
      "$", "i"
    );
    return regex.test(url);
  }
  
  app.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function(err) {
    if (err) throw err;
    console.log('Kurtz app listening on port 8080!');
  });
});