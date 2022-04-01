const Discord = require("discord.js");


module.exports = {
    name:"create",
    description:"",
    args:["keyword"],
    async execute(interaction,args)
    {
        await interaction.reply({content:args[0],ephemeral:false});
    }





}