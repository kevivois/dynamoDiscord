const { Client, Intents } = require('discord.js');
const { MongoClient } = require("mongodb");
const fs = require('fs');

const Discord = require("discord.js");
const config = require("./config.json");
const uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const dbclient = new MongoClient(uri);
const dbName = "Dynamo";
const collectionName = "guild";
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith(".js"));


const client = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILDS','GUILD_MEMBERS'] 
  });


client.login(config.BOT_TOKEN);

client.on("ready",() => {
    console.log("Bot connecté " + client.user.id);
    tryConnection();
    
})



client.on("messageCreate", async msg => {


    if(msg.author.id == client.user.id) return;
    await dbclient.connect();
    var guild = await dbclient.db(dbName).collection(collectionName).findOne({id:msg.guild.id});
    
    var users = guild.users;
    var user;
    users.forEach(usr => {

        if(usr.id == msg.author.id)
        {
            user = usr;
        }
        
    })

    var msgcontent =  msg.content < 50 ? msg.content : msg.content.substring(0,50);

    var date = new Date();

    var message = {id:msg.id,content:msgcontent,date:date.getTime()}

    // insert message into db
    var insertmessage = await dbclient.db(dbName).collection(collectionName).updateOne({"id":msg.guild.id,"users.id":user.id},{$push:{"users.$.messages":{message}}});

    console.log("inserting message into db");
    
    
    

})

client.on("messageDelete", async msg => {

    console.log(msg);
    if(!msg.author.id)
    {
        if(msg.author.id == client.user.id) return;
    }
    await dbclient.connect();
    var guild = await dbclient.db(dbName).collection(collectionName).findOne({id:msg.guild.id});
    
    var users = guild.users;
    var user;
    users.forEach(usr => {

        if(usr.id == msg.author.id)
        {
            user = usr;
        }
        
    })


    var deleteMessage = await dbclient.db(dbName).collection(collectionName).updateOne({"id":msg.guild.id,"users.id":user.id},{$pull:{
        "users.$.messages":{}
    }});

    console.log("deleting message into db");
    console.log(deleteMessage);
    
    
    

})

// bot joining discord server

client.on("guildCreate", guild => {

   
    addGuildIntoDB(guild);
    

})

const addGuildIntoDB = async (guild) => {

    
    var lstMembres = [];
    
            var membres = await guild.members.fetch();
             
            
            await membres.forEach(async member => 
            {
                if(member.id != client.user.id)
                {
                    await lstMembres.push({id:member.id,messages:[]});
                }
                
            })
    

    const JsonData = {id:guild.id,users:lstMembres,commands:[],data:[]};

    await dbclient.close();

    await dbclient.connect();

    var db = await dbclient.db(dbName);
   
    var rowExisting = await db.collection(collectionName).findOne({"id":guild.id}) ;

    //console.log(JsonData);
    if(!rowExisting)
    {
        var insert = await db.collection(collectionName).insertOne(JsonData);
    }
    
    console.log(insert);

    await dbclient.close();
     

};



const tryConnection = async () => {

    try
    {
        await dbclient.close();

        await dbclient.connect();
       
        var db = await dbclient.db(dbName);

        if(!db)
        {
           MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
           db = await dbclient.db(dbName);
        }
        if(!db.collection(collectionName))
        {
            db.createCollection(collectionName);
        }

        return true;
    }
    catch(error)
    {
        console.log(error);

        return false;
    }
    
}