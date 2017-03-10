# URL Shortener Microservice
## Run locally
Install mongo:
    `sudo apt-get install -y mongodb-org`
    
Run with local data files
    `mongod --port 27017 --dbpath=./data --smallfiles`
    
Insert into the counters collection, the initial value for the userid:
```
db.counters.insert({
    _id: "count",
    seq: 1000
})
```

Create .env file. 
    `mv example.env .env` 
and fill in the .env file with your app environment configaration info.

Start the server
    `node server.js`    
