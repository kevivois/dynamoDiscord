const Discord = require("discord.js");
const { Collection, MongoClient } = require("mongodb");
const { SlashCommandBuilder,SlashCommandStringOption  } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const  config = require("../config.json");


module.exports = {
    name:"custom",
    description:"custom command ",
    args:["name"],
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {String[]} args 
     * @param {MongoClient} dbclient
     */
    async execute(interaction,args,dbclient)
    {
        if(interaction)
        {
            await interaction.deferReply();
            await dbclient.connect();
            const a = false;
            const guild = await dbclient.db("Dynamo").collection("guild").findOne({id:interaction.guild.id});
             console.log(guild.commands);
            if(a)
            {
               
                 await interaction.editReply({content:command.content})
            }
            else
            {
                //await interaction.guild.commands?.delete({name:interaction.commandName});
               
                 await interaction.editReply({content:"command doesn't exist"});
            }
            await dbclient.close();
        }
    }
}