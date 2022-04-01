const { Client, Intents } = require('discord.js');
const { SlashCommandBuilder,SlashCommandStringOption  } = require('@discordjs/builders');
const { MongoClient } = require("mongodb");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const Discord = require("discord.js");
const config = require("./config.json");
const { args } = require('./commands/createCustom');
const uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
const dbclient = new MongoClient(uri);
const dbName = "Dynamo";
const collectionName = "guild";
const DynamoGuildId = "958710845796413440";
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
const rest = new REST({ version: '9' }).setToken(config.BOT_TOKEN);

const client = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILDS','GUILD_MEMBERS'] 
  });

  client.commands = new Discord.Collection();


for(const file of commandFiles)
     {
         try{
            const command = require(`./commands/${file}`);
            client.commands.set(command.name,command);
         }
         catch(error)
         {
             console.log(error);
         }
     }





  CommandsConfiguration();








client.on("ready",() => {
    console.log("Bot connecté " + client.user.id);
    tryConnection();
    
})


// ajout du message dans la BD
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

    var message = {id:msg.id,date:date.getTime()}

    // insert message into db
    var insertmessage = await dbclient.db(dbName).collection(collectionName).updateOne({"id":msg.guild.id,"users.id":user.id},{$push:{"users.$.messages":message}});

    console.log("inserting message into db",insertmessage);

})


// ajout de la guild dans la BD

client.on("guildCreate", guild => {

   
    addGuildIntoDB(guild);
    

})

client.on("guildDelete",async guild => {

    removeGuildFromDb(guild);

})

const removeGuildFromDb = async(guild) => {
    
    await dbclient.connect();

    var query = await dbclient.db(dbName).collection(collectionName).deleteOne({"id":guild.id});

    console.log("removing guild from DB",query);
    
    await dbclient.close();
}
const addGuildIntoDB = async (guild) => {

    try
    {
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

    }    
    catch(error)
    {
        console.log(error);
        
    }
     

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
        await dbclient.close();
        return true;
    }
    catch(error)
    {
        console.log(error);

        return false;
    }
    
}


client.on("guildMemberAdd",async member => {
    try
    {
        await dbclient.close();

        await dbclient.connect();

        await addMemberIntoDB(member);

        await dbclient.close();


    }
    catch(error)
    {
        console.log(error);
    }

})

client.on("guildMemberRemove",async member => {

    try
    {
        await dbclient.close();

        await dbclient.connect();

        await RemoveMemberFromDB(member);

        await dbclient.close();


    }
    catch(error)
    {
        console.log(error);
    }
    
})





const addMemberIntoDB = async (member) => {

    var db = await dbclient.db(dbName).collection(collectionName);

    var guild = await db.findOne({"id":member.guild.id});

    var user = guild.users.find(usr => usr.id == member.id);

    if(user) return;
    

    var query = await db.updateOne({"id":member.guild.id,},{$push:{
        "users":
            {id:member.id,messages:[]}
        
    }});

    console.log("inserting new user into DB :",query);

};

const RemoveMemberFromDB = async (member) => {

    var db = await dbclient.db(dbName).collection(collectionName);

    var query = await db.updateOne({"id":member.guild.id},{$pull:{
        users:{
            id:member.id
        }
    }})

    console.log("remove user from DB",query);

};

//###############################################################
// Mise en place des commandes
// ##############################################################



async function CommandsConfiguration()
{

    await dbclient.connect();

    


    var guilds = await dbclient.db(dbName).collection(collectionName).find({}).toArray();
    await dbclient.close();

    for(guild of guilds)
    {

    
        var guildCommands = guild.commands;
        let Customcommands = [];
        let GlobalCommands = [];
        //commands.map(command => command.toJSON());

        for(cmd of guildCommands)
        {
            //name,description,content
            
            Customcommands.push(new SlashCommandBuilder().setName(cmd.name).setDescription(cmd.description));
            
        }

        GlobalCommands = [
            new SlashCommandBuilder().setName("create").setDescription("Create a custom command")
            .addStringOption(new SlashCommandStringOption().setName("keyword").setDescription("keyword for custom command").setRequired(true))
        ];

        (async () => {
            try{
                console.log("commands are refreshing");

                await rest.put(
                    Routes.applicationGuildCommands(config.APP_ID,DynamoGuildId),  
                    {
                        body:GlobalCommands
                    },
                );
                console.log("Commands are successfully reloaded");
            }
            catch(error)
            {
                console.log(error);
            }
        })

        (async () => {
            try{
                console.log("commands are refreshing");

                /*
                Global commands

                Routes.applicationGuildCommands(client.user.id),{body:commands};
                */

                await rest.put(
                    Routes.applicationGuildCommands(config.APP_ID,guild.id),  
                    {
                        body:Customcommands
                    },
                );
                console.log("Commands are successfully reloaded");
            }
            catch(error)
            {
                console.log(error);
            }
        })
    }


}




client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
     if (!client.commands.has(interaction.commandName)) return;

     try
     {

     
        let options = []
        for (let arg of client.commands.get(interaction.commandName).args) options.push(interaction.options.get(arg).value)
        client.commands.get(interaction.commandName).execute(interaction,options);

     }
     catch(error)
     {
         console.log(error);
     }



     
      
})

client.login(config.BOT_TOKEN);

