const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
var dbclient = null //new MongoClient(uri,{ useUnifiedTopology: true}, { useNewUrlParser: true }, { keepAlive: 1});

function getInstance()
{
    
    if(dbclient == null)
    {
        dbclient = new MongoClient(uri,{ useUnifiedTopology: true}, { useNewUrlParser: true }, { keepAlive: 1});
        dbclient.connect();
    }
    return dbclient;
}
module.exports = getInstance();


