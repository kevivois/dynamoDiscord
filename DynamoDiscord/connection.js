const { MongoClient } = require("mongodb");     // client mongodb

const uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";        // url de la base de donnée en local
var dbclient = null // variable contenant le client pour se connecter à la BD

function getInstance()      // fonction qui retourne l'instance de connexion à la BD
{
    
    if(dbclient == null)
    {
        dbclient = new MongoClient(uri,{ useUnifiedTopology: true}, { useNewUrlParser: true }, { keepAlive: 1});        // instanciation
        dbclient.connect();                                                                                             // connection
    }
    return dbclient;            
}
module.exports = getInstance();             // exportation du module


