const Discord = require("discord.js");
const { Collection, MongoClient } = require("mongodb");
const { SlashCommandBuilder,SlashCommandStringOption  } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const  config = require("../config.json");


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

        const prefixs = ["!",".",",",":",";","-","_","+","*","#","%","&","|","?","<",">"]
        try {

        
        //if(interaction.options)
            await dbclient.close();
            await dbclient.connect();
            
            
            if(interaction.options.getSubcommand() == "create")
            {
                // Creation de la commande personnalisée    
                if(!interaction.memberPermissions.has("ADMINISTRATOR"))
                {
                    await dbclient.close();
                    await interaction.reply({content:"you don't have the permission to do that !",ephemeral:true});
                }

                const prefix = prefixs.filter(pr => pr === interaction.options.get("name").value.substring(0,1)) ? interaction.options.get("name").value.substring(0,1) : null;

                if(!prefix)
                {
                    await dbclient.close();
                    return interaction.reply("invalid prefix !");
                }

                var isExistingRow = await dbclient.db("Dynamo").collection("guild").findOne({id:interaction.guild.id,commands:{prefix:prefix,name:interaction.options.get("name")}});

                if(isExistingRow)
                {
                    await interaction.reply({content:"command name alreay existing !",ephemeral:true});
                }
                const description = (interaction.options.get("description") ? interaction.options.get("description").value : "a custom command")
                const commandWithOutPrefix = interaction.options.get("name").value.toLowerCase().substring(1,interaction.options.get("name").value.length);

                const command = {prefix:prefix,name:commandWithOutPrefix,description:description,content:interaction.options.get("content").value,creator:interaction.user.id};
                
                var insertCommand = await dbclient.db("Dynamo").collection("guild").updateOne({"id":interaction.guild.id},{$push:{"commands":command}});
                console.log("created a new command into DB guild " + interaction.guild.name,Date.now());
                await dbclient.close();
                await client.commands.set(command.name,require("./custom"));
                await interaction.reply({content:"command well created !",ephemeral:true});
            }
            await dbclient.close();

        }
        catch(error)
        {
            console.log(error);
            await dbclient.close();
            await interaction.reply({content:"error !",ephemeral:true});
        }
         
        
    }





}
