const Discord = require("discord.js");
const { Collection, MongoClient } = require("mongodb");
const { SlashCommandBuilder,SlashCommandStringOption  } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const  config = require("../config.json");
const dbName = "Dynamo";
const collectionName = "guild";
const prefixs = ["!", ".", ",", ":", ";", "-", "_", "+", "*", "#", "%", "&", "|", "?", "<", ">"]


module.exports = {
    name:"command",
    description:"",
    args:["prefix","name","content"],
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {String[]} args 
     * @param {MongoClient} dbclient
     * @param {Discord.Client} client
     */
    async execute(interaction,args,dbclient,client)
    {    
        try {
        //if(interaction.options)
            
            
           
                if(interaction.options.getSubcommand() == "create")
                {
                    // Creation de la commande personnalisée    
                    

                    const prefix = prefixs.find(pr => pr === interaction.options.get("name").value.substring(0,1)) ? interaction.options.get("name").value.substring(0,1) : null;

                    if(!prefix)
                    {
                       
                        return interaction.reply("invalid prefix !");
                    }

                    var isExistingRow = await dbclient.db(dbName).collection(collectionName).findOne({id:interaction.guild.id,commands:{prefix:prefix,name:interaction.options.get("name")}});

                    if(isExistingRow)
                    {
                        await interaction.reply({content:"command name alreay existing !",ephemeral:true});
                    }
                    const description = (interaction.options.get("description") ? interaction.options.get("description").value : "a custom command")
                    const commandWithOutPrefix = interaction.options.get("name").value.toLowerCase().substring(1,interaction.options.get("name").value.length);

                    const command = {prefix:prefix,name:commandWithOutPrefix,description:description,content:interaction.options.get("content").value,creator:interaction.user.id};
                    
                    var insertCommand = await dbclient.db(dbName).collection(collectionName).updateOne({"id":interaction.guild.id},{$push:{"commands":command}});
                    console.log("created a new command into DB guild " + interaction.guild.name,Date.now());
                    
                    await client.commands.set(interaction.options.get("name").value.toLowerCase(),require("./custom"));
                    await interaction.reply({content:"command well created !",ephemeral:true});
                }
                else if(interaction.options.getSubcommand() == "list")
                {
                    //list all custom commands 

                   

                    const guild = await dbclient.db(dbName).collection(collectionName).findOne({id:interaction.guild.id});

                    const commands = guild.commands;

                    const formatedCommands = [];

                    for(const cmd of commands)
                    {
                        const creator = await interaction.guild.members.fetch(cmd.creator);
                        formatedCommands.push({name:cmd.prefix+cmd.name,value:`${creator.user}`,inline:false});
                    }
                    
                    const embed = await {
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
                        "fields": formatedCommands
                      }

                      

                      if(guild.commands.length > 0)
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
            console.log(error);
            
            await interaction.reply({content:"error !",ephemeral:true});
        }
         
        
    }

}
