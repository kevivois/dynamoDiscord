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
     * @param {String} prefix 
     * @param {Discord.Message} message 
     * @param {import("mongodb").WithId} guild
     * @param {any{}} cmd
     */
    async execute(prefix,message,guild,cmd)
    {
        
        return await message.reply({content:cmd.content});
      

    }
}