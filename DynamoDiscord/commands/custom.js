const Discord = require("discord.js");
const {Collection,MongoClient} = require("mongodb");

module.exports = {
    name:"custom",
    descritption:"custom command",
    args:["name"],
    
    /**
     * 
     * @param {String} prefix 
     * @param {Discord.Message} message 
     * @param {import("mongodb".WithId)} guild 
     * @param {any{}} cmd 
     */
    async execute(prefix,message,guild,cmd)
    {
        return await message.reply({content:cmd.content});
    }
}