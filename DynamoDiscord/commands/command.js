const Discord = require("discord.js");
const { Collection, MongoClient } = require("mongodb");
const { SlashCommandBuilder,SlashCommandStringOption  } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const  config = require("../config.json");


module.exports = {
    name:"command",
    description:"",
    args:["name","content"],
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {String[]} args 
     * @param {MongoClient} dbclient
     * @param {Discord.Client} client
     */
    async execute(interaction,args,dbclient,client)
    {
        //if(interaction.options)
        await dbclient.close();
        await dbclient.connect();
        
        
        if(interaction.options.getSubcommand() == "create")
        {
            // Creation de la commande personnalisée    
            if(!interaction.memberPermissions.has("ADMINISTRATOR"))
            {
                await dbclient.close();
                return await interaction.reply({content:"you don't have the permission to do that !",ephemeral:true});
            }
            const description = (interaction.options.get("description") ? interaction.options.get("description").value : "a custom command")
            const command = {name:interaction.options.get("name").value.toLowerCase(),description:description,content:interaction.options.get("content").value};
            var insertCommand = await dbclient.db("Dynamo").collection("guild").updateOne({"id":interaction.guild.id},{$push:{"commands":command}});
            console.log("created a new command into DB guild " + interaction.guild.name,Date.now());
            await dbclient.close();
            

            // reload,add command of the specific server
            const Slashcommand = new SlashCommandBuilder().setName(interaction.options.get("name").value.toLowerCase())
                                                     .setDescription(description.toLowerCase());

            await addCommandToGuild(interaction.guild.id,Slashcommand);
                                                  
            client.commands.set(command.name,require("./custom"));
            return await interaction.reply({content:"command well created !",ephemeral:true});
        }
        await dbclient.close();
        return await interaction.reply({content:"error",ephemeral:true});
        
    }





}
/**
 * 
 * @param {String} guild_id 
 * @param {SlashCommandBuilder} command 
 */
const addCommandToGuild = async(guild_id,command) => {

    const rest = new REST({ version: '9' }).setToken(config.BOT_TOKEN);

	try {
		console.log('Command added to the server.');

		await rest.put(
			Routes.applicationGuildCommands(config.APP_ID,guild_id),
			{ body: [command] }
		);

		console.log('Commands reloaded.');
	} catch (error) {
		console.error(error);
	}
    
}