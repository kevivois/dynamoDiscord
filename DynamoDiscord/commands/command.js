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

                var isExistingRow = await dbclient.db("Dynamo").collection("guild").findOne({id:interaction.guild.id,commands:{name:interaction.options.get("name")}});

                if(isExistingRow)
                {
                    await interaction.reply({content:"command name alreay existing !",ephemeral:true});
                }
                const description = (interaction.options.get("description") ? interaction.options.get("description").value : "a custom command")
                const command = {name:interaction.options.get("name").value.toLowerCase(),description:description,content:interaction.options.get("content").value};
                var insertCommand = await dbclient.db("Dynamo").collection("guild").updateOne({"id":interaction.guild.id},{$push:{"commands":command}});
                console.log("created a new command into DB guild " + interaction.guild.name,Date.now());
                await dbclient.close();
                

                // reload,add command of the specific server
                const Slashcommand = new SlashCommandBuilder().setName(interaction.options.get("name").value.toLowerCase())
                                                        .setDescription(description.toLowerCase());

                await addCommandToGuild(interaction,Slashcommand);
                                                    
                await client.commands.set(command.name,require("./custom"));
                await interaction.reply({content:"command well created !",ephemeral:true});
            }
            await dbclient.close();

        }
        catch(error)
        {
            await dbclient.close();
           // await interaction.reply({content:"error !",ephemeral:true});
        }
         
        
    }





}
/**
 * 
 * @param {SlashCommandBuilder} command 
 * @param {Discord.CommandInteraction} interaction 
 */
const addCommandToGuild = async(interaction,command) => {

    const rest = new REST({ version: '9' }).setToken(config.BOT_TOKEN);
    const  test = new SlashCommandBuilder();
    test.name
    test.description

    
    const array = []
    array.concat(interaction.guild.commands);
    array.push(command);
    
    
	try {
		console.log('Command added to the server.');

        /*
         await rest.put(Routes.applicationGuildCommands(config.APP_ID,interaction.guild.id),
         { body: array },
        */
		

         await rest.put(Routes.applicationGuildCommands(config.APP_ID,interaction.guild.id),
         { body: array },
         
     );

		console.log('Commands reloaded.');
	} catch (error) {
		console.error(error);
	}
    
}