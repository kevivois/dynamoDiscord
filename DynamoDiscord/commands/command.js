
// Importations utiles pour le projet
//=====================================

const Discord = require("discord.js");
const { Collection, MongoClient } = require("mongodb");
const { SlashCommandBuilder,SlashCommandStringOption  } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const  config = require("../config.json");                                                              // fichier de configuration
const dbName = "Dynamo";                                                                                // nom de la BD
const collectionName = "guild";                                                                         // nom de la collection de la BD
const prefixs = ["!", ".", ",", ":", ";", "-", "_", "+", "*", "#", "%", "&", "|", "?", "<", ">"]        // prefix de commandes personalisées


module.exports = {
    name:"command",         // nom de la command
    description:"",         // description
    args:["prefix","name","content"],       // arguments en parametress
    /**
     * Parametres
     * @param {Discord.CommandInteraction} interaction
     * @param {String[]} args
     * @param {MongoClient} dbclient
     * @param {Discord.Client} client
     */
    async execute(interaction,args,dbclient,client)     // fonction d'execution
    {
        try {
                if(interaction.options.getSubcommand() == "create") // test de la sous-commande
                {
                      // creation de commandes personalisées

                        // test si le prefix de la commande crée est dans la liste de prefix prédefinie
                    const prefix = prefixs.find(pr => pr === interaction.options.get("name").value.substring(0,1)) ? interaction.options.get("name").value.substring(0,1) : null;

                    if(!prefix)
                    {

                        return interaction.reply("invalid prefix !");       // si le prefix n'est pas correct,
                    }
                    // test si la commande qu'on veut crée existe déjà
                    var isExistingRow = await dbclient.db(dbName).collection(collectionName).findOne({id:interaction.guild.id,commands:{prefix:prefix,name:interaction.options.get("name")}});

                    if(isExistingRow)       // si elle existe , ne pas la crée
                    {
                        await interaction.reply({content:"command name alreay existing !",ephemeral:true});     //  retour du message
                    }
                    const description = (interaction.options.get("description") ? interaction.options.get("description").value : "a custom command")        // description de la commande
                    const commandWithOutPrefix = interaction.options.get("name").value.toLowerCase().substring(1,10); // commande sans le prefix

                    const command = {prefix:prefix,name:commandWithOutPrefix,description:description,content:interaction.options.get("content").value,creator:interaction.user.id};     // object representant la commande qui sera ajoutée

                    var insertCommand = await dbclient.db(dbName).collection(collectionName).updateOne({"id":interaction.guild.id},{$push:{"commands":command}});       // insertion de la commande dans la BDD
                    console.log("created a new command into DB guild " + interaction.guild.name,Date.now());

                    await client.commands.set(interaction.options.get("name").value.toLowerCase(),require("./custom"));     // ajout de la commande dans la liste de commande du bot discord
                    await interaction.reply({content:"command well created !",ephemeral:true});
                }
                else if(interaction.options.getSubcommand() == "list")
                {
                    // lister toutes les commandes existentents dans la BDD
                    const guild = await dbclient.db(dbName).collection(collectionName).findOne({id:interaction.guild.id});      // recuperation du serveur
                    const commands = guild.commands;        // recuperation des commands
                    const formatedCommands = [];
                    for(const cmd of commands)      // formatage des commandes pour l'ajout dans un embed
                    {
                        const creator = await interaction.guild.members.fetch(cmd.creator);
                        formatedCommands.push({name:cmd.prefix+cmd.name,value:`${creator.user}`,inline:false});     // ajout de chaque command dans la liste d'affichage
                    }

                    const embed = await {       // création de l'embed d'affichages des commmandes
                        "title": `Commands list  `,
                        "color": 8192236,
                        "timestamp": `${new Date(Date.now()).toLocaleDateString("fr-FR")}`,
                        "footer": {
                          "icon_url": `${interaction.guild.client.user.avatarURL({format:"png",size:4096})}`,
                          "text": `${interaction.guild.client.user.username} | ${new Date(Date.now()).toLocaleDateString("fr-FR")}`
                        },
                        "author": {
                          "name": `${interaction.user.username}`,
                          "url":"https://discordapp.com",
                          "icon_url": `${interaction.user.avatarURL({size:4096,format:"png"})}`
                        },
                        "fields": formatedCommands      // ajout des commandes
                      }
                      if(guild.commands.length > 0)     //si il y a des commandes , les retourner
                      {
                        return interaction.reply({embeds:[embed]});
                      }
                      else
                      {
                          return interaction.reply({content:"pas de commandes crées"});
                      }
                }
        }
        catch(error)
        {
            console.log(error);     // si'l y a erreur , retourner un message d'erreur

            await interaction.reply({content:"error !",ephemeral:true});
        }
    }

}       // ne pas oublier l'accolade de fin
