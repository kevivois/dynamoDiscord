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
     * @param {MongoClient} dbclient
     */
    async execute(prefix,message,dbclient)
    {
        const cmd = message.content;
       return message.reply("test")
    }
}