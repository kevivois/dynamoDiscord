
// Importations utiles pour le projet
//=====================================

const { Client, Intents } = require('discord.js');                                  // importation du clients discords
const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');       // importations des commandes discords
const { MongoClient } = require("mongodb");                                                     // importation du client mongoDB
const { REST } = require('@discordjs/rest');                                                    // importation de l'api discord
const { Routes } = require('discord-api-types/v9');                                             // importation pour communiquer avec l'api discord
const fs = require('fs');                                                                       // importation pour lire des dossiers
const prefixs = ["!", ".", ",", ":", ";", "-", "_", "+", "*", "#", "%", "&", "|", "?", "<", ">"]// liste des préfixs autorisés pour la création de commandes personalisées
var dbclient = require("./connection");

const Discord = require("discord.js");                                                          //imortation de discord
const config = require("./config.json");                                                        // importation du fichier contenant les variables globales
const dbName = "Dynamo";                                                                        // nom de la BDD
const collectionName = "guild";                                                                 // nom de la collection dans la BDD
                                                 
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));        // recuperations des fichiers de commandes
const rest = new REST({ version: '9' }).setToken(config.BOT_TOKEN);                             // instanciation pour l'api discord et les commandes

const client = new Client({     // instanciation du client du bot discord 
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: ['DIRECT_MESSAGES',        // droit demandés au serveur, attribués au bot Discord
    'DIRECT_MESSAGE_REACTIONS', 
    'GUILD_MESSAGES', 
    'GUILD_MESSAGE_REACTIONS', 
    'GUILDS', 'GUILD_MEMBERS',
    "GUILD_BANS","GUILD_PRESENCES",
    "DIRECT_MESSAGES",
    "GUILD_VOICE_STATES",
    "GUILD_INVITES",
    "GUILD_INTEGRATIONS"],
});

client.commands = new Discord.Collection();     // instanciation d'une liste de commandes qui contiendra la liste des commandes

//recuperations des différentes commandes globales
for (const file of commandFiles) {                      // boucle dans les fichiers de commmandes
    try {
        const command = require(`./commands/${file}`);  // Recuperation de la commande du fichier concerné
        client.commands.set(command.name, command);     // ajout des commandes dans la liste de commandes du client discord
    }
    catch (error) {
        console.log(error);
    }
}
console.log(client.commands);

// fonction permettant d'ajouter les commandes personalisées de chaque serveurs dans la liste de commandes du client discord
const addCommandsToClient = async () => {

    dbclient = require("./connection");     // recuperation de la connection

    const collection = await dbclient.db(dbName).collection(collectionName);        // recuperation de la collection
    const guilds = await collection.find({});                                       // recuperation de touts les enregistrements, serveurs dans la collection
    
    guilds.forEach(async guild => { // boucle sur touts les serveurs
        for (cmd of guild.commands) {       // boucle sur toutes les commandes
            await client.commands.set(cmd.prefix + cmd.name, require("./commands/custom"));     // ajout de la commande dans la liste 
            //avec comme commande, le fichier de commande personalisé "custom"
            
        }
    });
}

addCommandsToClient();      // Ajout des différentes commandes de la bd au bot discord

CommandsConfiguration();    // ajout des différentes commandes globales au différents serveurs sur lequel le bot est.

client.on("ready", () => {      // function qui gère lorsque le bot discord est lancé
    console.log("Bot connecté " + client.user.id);
    tryConnection();            // fonction qui gère la BD

})
client.on("messageCreate", async msg => {       // fonction qui gère lorsqu'un message est crée sur le chat discord
    dbclient = require("./connection");         // connection à la BD
    if (msg.author.id == client.user.id) return;        // si l'auteur du message est un le bot, ne rien faire
    var guild = await dbclient.db(dbName).collection(collectionName).findOne({ id: msg.guild.id });     // recuperation de la guild concerné
    if (!guild) {       // si la guild n'existe pas , vérifier la BDD et la connection avec celle-ci
        tryConnection(); 
        guild = await dbclient.db(dbName).collection(collectionName).findOne({ id: msg.guild.id }); // recuperation de la guild concerné
        if (!guild) {       // si la guild n'exsite pas, l'ajouter dans la BD
            await addGuildIntoDB(msg.guild);        // ajout
            guild = await dbclient.db(dbName).collection(collectionName).findOne({ id: msg.guild.id });     // recuperation de la guild conerné
        }
    }
    var prefix = msg.content.substring(0, 1);       // recuperation du prefix du message
    var command = prefixs.filter(pr => pr === prefix) ? msg.content.substring(1, 10) : null;        // recuperation de la commande
    if (!command) return    // si ce n'est pas une commande , ne rien faire
    const commands = guild.commands;        // recuperation des commandes existentes dans la BDD , pour le serveur concerné
    if (commands.filter(cmd => cmd.prefix === prefix && cmd.name === command).length > 0) {     // recherche si la commande existe, si oui , renvoyé le contenu
        const cmd = commands.find(cmd => cmd.prefix === prefix && cmd.name === command);        // recuperation de la commande de la BDD
        try
        {
            if (cmd) await client.commands.get(msg.content).execute(prefix, msg, guild, cmd);  
        }
        catch(error)
        {
            client.commands.set(msg.content,require("./commands/custom"));
            if (cmd) await client.commands.get(msg.content).execute(prefix, msg, guild, cmd);  
        }
             // si elle existe , execution de la commande
    }
    var users = guild.users;        //recuperation des utilisateurs de la guild
    var user;
    users.forEach(usr => {      // boucle sur touts les utilisateurs
        if (usr.id == msg.author.id) {      // si l'utilisateur qui a écris le message existe dans la BDD
            user = usr;
        }
    })
    var date = new Date();      // recuperation de la date actuelle
    var message = { id: msg.id, date: date.getTime() }      // enregistrement qui va être ajouté à la BDD
    //Insertion du message de la BDD si ce n'est pas une commande
    //====================================
    if (!client.commands.has(msg.content)){
var insertmessage = await dbclient.db(dbName).collection(collectionName).updateOne({ "id": msg.guild.id, "users.id": user.id }, { $push: { "users.$.messages": message } });
        console.log("inserting message into db", insertmessage);
    } 
})

client.on("guildCreate", guild => {     // fonction qui s'execute lorsque le bot est ajouté à un serveur
    addGuildIntoDB(guild);      // ajout du serveur de la BDD
})

client.on("guildDelete", async guild => {       // fonction qui s'execute lorsque le bot est supprimé ou qui un serveur
    removeGuildFromDb(guild);       // suppression du serveur de la BDD
})

const removeGuildFromDb = async (guild) => {     // fonction qui retire un serveur de la BDD
    dbclient = require("./connection");     // recuperation de la connection à la BDD

    var query = await dbclient.db(dbName).collection(collectionName).deleteOne({ "id": guild.id });     // requête de suppression

    console.log("removing guild from DB", query);
}

const addGuildIntoDB = async (guild) => {       // fonction qui ajoute un serveur à la BDD

    dbclient = require("./connection");     // recuperation de la connection à la BDD

    try {
        var lstMembres = [];
        var membres = await guild.members.fetch();      // listes des membres du serveur

        await membres.forEach(async member => {     // boucle sur chaque membres, ajout du membres dans la liste de membres formatée pour la BDD
            if (member.id != client.user.id) {
                await lstMembres.push({ id: member.id, messages: [] ,joinedAt:Date.now()});         // ajout
            }
        })

        const JsonData = { id: guild.id, users: lstMembres, commands: [], data: [],createAt:Date.now()};        // enregistrement formaté qui va être ajouté a la BDD
        var db = await dbclient.db(dbName);     // recuperation de la BD
        var rowExisting = await db.collection(collectionName).findOne({ "id": guild.id });      // on verifie si le serveur est déjà dans la BDD

        if (!rowExisting) { //si le serveur n'est pas déjà dans la BD
            var insert = await db.collection(collectionName).insertOne(JsonData);       // insertion
            console.log(insert);
        }
    }
    catch (error) {
        console.log(error);
    }
};
const tryConnection = async () => {     // fonction qui s'execute pour vérifier l'intégrité de la BDD
    try {
        dbclient = require("./connection");     // recuperation de la connection
        var db = await dbclient.db(dbName);     // recuperation de la table

        if (!dbclient.db("Dynamo")) {   // si la BDD n'existe pas

            MongoClient.connect(`mongodb://localhost:27017/${dbName}`);     // creation de la BD
            db = await dbclient.db(dbName);     // recuperation de la BD
        }
        var collections = await db.collections();       // on verifie si la collection existe
        if (collections.filter(c => c.dbName == "Dynamo").length == 0) {        // si elle n'existe pas , on la crée
            await db.createCollection(collectionName);
        }
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}
client.on("guildMemberAdd", async member => {       // fonction qui s'excute lorsqu'un utilisateur rejoins un serveur 
    try {
        await addMemberIntoDB(member);      // ajout de l'utilisateur dans la BDD
    }
    catch (error) {
        console.log(error);
    }
})
client.on("guildMemberRemove", async member => {        // fonction qui s'execute lorsqu'un utilisateur quitte le serveur
    try {
        await RemoveMemberFromDB(member);       // suppression de l'utilisateur
    }
    catch (error) {
        console.log(error);
    }
})
const addMemberIntoDB = async (member) => {     // fonction pour ajouter un utilisateur dans la BD

    dbclient = require("./connection");             // recuperation de la connexion
    var db = await dbclient.db(dbName).collection(collectionName);      // recuperation de la collection
    var guild = await db.findOne({ "id": member.guild.id });        // recupteration du serveur concerné
    var user = guild.users.find(usr => usr.id == member.id);        // on verifie si l'utilisateur n'est pas déjà dans la BDD
    if (user) return ;      // si oui, ne rien faire

    var query = await db.updateOne({ "id": member.guild.id, }, {        // ajout de l'utilisateur dans la BDD
        $push: {
            "users":
                { id: member.id, messages: [],joinedAt:Date.now()}
        }
    });
    console.log("inserting new user into DB :", query);
};

const RemoveMemberFromDB = async (member) => {  // fonction pour supprimer un utilisateur de la BD

    dbclient = require("./connection");                               // recuperation de la connexion
    var db = await dbclient.db(dbName).collection(collectionName);   // recuperation de la collection

    var query = await db.updateOne({ "id": member.guild.id }, {     // suppression de la BDD
        $pull: {
            users: {
                id: member.id
            }
        }
    })
    console.log("remove user from DB", query);
    
};
async function CommandsConfiguration() {        // fonction permettant de configurer les commandes globales du bot discord
    dbclient = require("./connection");         // recuperation de la connection
    GlobalCommands = [      // liste contenant les commandes globales
    new SlashCommandBuilder().setName("command").setDescription("Command management")// creations des différentes commandes "SlashCommands" et sous-commandes , arguments, etc ...
            .addSubcommand(cmd =>
                cmd
                    .setName("create")          // commande "command create"
                    .setDescription("Create a custom command")
                    .addStringOption(new SlashCommandStringOption().setName("name").setDescription("name of the command with the prefix").setRequired(true))
                    .addStringOption(new SlashCommandStringOption().setName("content").setDescription("content of the command").setRequired(true))
                    .addStringOption(new SlashCommandStringOption().setName("description").setDescription("description of the command"))
            ).addSubcommand(cmd =>      
                cmd             // commande "command list"
                    .setName("list")
                    .setDescription("list all custom commands"))
        ,
        new SlashCommandBuilder().setName("stats").setDescription("get somes statistics from the server & users")       // commande de stats avec ses sous-commandes
            .addSubcommand(cmd => cmd.setName("me").setDescription("get your stats"))       // commande "stats me"
            .addSubcommand(cmd => cmd.setName("messages").setDescription("get the stats of the server"))        // commande "stats messages"
    ];
    try {
        console.log("commands are refreshing");

        await rest.put(             // ajout des commandes dans touts les serveurs grâce à l'API discord à travers la bibliothèque rest de discord
            
            Routes.applicationCommands(config.APP_ID),
            {
                body: GlobalCommands
            },
        );
        console.log("Commands are successfully reloaded");
    }
    catch (error) {
        console.log(error);
    }
}

client.on('interactionCreate', async interaction => {       // fonction qui s'execute lorsqu'une commande "SlashCommands" est écrite dans le chat
    dbclient = require("./connection");                     // recuperation de la connexion
    await console.log(interaction.commands);
    if (!interaction.isCommand()) ;     // si ce n'est pas une commande , ne rien faire

    if (!client.commands.has(interaction.commandName))  ;       // si le bot n'a pas cette commande dans la liste , ne rien faire
    try {
        if (!interaction)  return; 
        let options = []
        if (client.commands.length > 0) {
            for (let arg of client.commands.get(interaction.commandName).args) {        // boucle sur touts les arguments de la commandes
                if (interaction.options.get(arg)) {
                    options.push(interaction.options.get(arg).value);       //ajout dans une liste, des arguments de la commande
                }
            }
        }
        await client.commands.get(interaction.commandName).execute(interaction, options, dbclient,client);      // execution de la commande
    }
    catch (error) {
        console.log(error);
    }
})

client.login(config.BOT_TOKEN);             // !!! , connexion du bot dicord , avec le TOKEN dans "config.json"

