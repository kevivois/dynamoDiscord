const { Client, Intents } = require('discord.js');
const { MongoClient } = require("mongodb");

const Discord = require("discord.js");
const config = require("./config.json");
const uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const dbclient = new MongoClient(uri);



const client = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILDS'] 
  });

const tryConnection = async () => {

    try
    {
        await dbclient.close();

        await dbclient.connect();

        var db = await dbclient.db("Dynamo");

        if(!db.collection("server"))
        {
            throw new Error("server collection doesnt exist");
        }

        return true;
    }
    catch(error)
    {
        console.log(error);

        return false;
    }
    
}
client.login(config.BOT_TOKEN);

client.on("ready",() => {
    console.log("Bot connecté " + client.user.tag);
    if(!tryConnection())
    {
        client.destroy();
    }
    
})

client.on("messageCreate", msg => {

    if(msg.content == "dynamo")
    {
        msg.reply("yes");
    }

})

// bot joining discord server

client.on("guildCreate", guild => {

   
    var JSON = makeJsonGuild(guild);
    addGuildIntoDB(JSON);


})

const GuildIntoJson = async (guild) => {

    var lstMembres = [];

    membres.cache.forEach(member => {
        
        lstMembres.push({id:member.id,messages:0});
    })

    const JsonData = {id:guild.id,users:lstMembres};

    return JsonData;
     

};

const addGuildIntoDB = async (guild) => {
    await dbclient.close();

    await dbclient.connect();

    var db = await dbclient.db("Dynamo");
   
    
    var insert = await db.collection("server").insertOne(guild);
    

    await dbclient.close()
    
    
}