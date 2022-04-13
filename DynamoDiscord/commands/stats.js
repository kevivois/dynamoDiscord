const Discord = require("discord.js");
const { Collection, MongoClient } = require("mongodb");
const { SlashCommandBuilder,SlashCommandStringOption  } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const  config = require("../config.json");
const dbName = "Dynamo";
const collectionName = "guild";

module.exports = {
    name:"stats",
    description:"stats command ",
    //args:["prefix","name","content"],
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     * @param {String[]} args 
     * @param {MongoClient} dbclient
     */
    async execute(interaction,args,dbclient)
    {
        var date = new Date(Date.now());
        const prefixs = ["!",".",",",":",";","-","_","+","*","#","%","&","|","?","<",">"]
        /**
         * 
         * @param {Discord.User} discordUser utilisateur de discord
         * @param {any{}} guildUser utilisateur de la base de donnée
         */
        const statsEmbed = async (discordUser,guildUser) => {
            const embed = {
                "title": `@${discordUser.username} stats `,
                "url": "https://discordapp.com",
                "color": 8192236,
                "timestamp": `${new Date(Date.now()).toDateString()}`,
                "footer": {
                  "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png",
                  "text": `Dynamo bot |${Date.now()}`
                },
                "author": {
                  "name": `${interaction.guild.client.user.username}`,
                  "url": "https://discordapp.com",
                  "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
                },
                "fields": [
                  {
                    "name": "messages",
                    "value": `Vous avez écris ${guildUser.messages.length} messages depuis votre arrivée, ${discordUser}`
                  },
                  {
                    "name": "Activitée",
                    "value": "Cela fait une moyenne de @moyenne par jour "
                  },
                  {
                    "name": "🙄",
                    "value": "an informative error should show up, and this view will remain as-is until all issues are fixed"
                  },
                ]
              }

              return embed;
        };
        try
        {

        
            
             /**stats command */
             
                // personal stat
                if(interaction.options.getSubcommand() === "me")
                {
                    
                    const discordUser = interaction.user;

                    const guild = await dbclient.db(dbName).collection(collectionName).findOne({id:interaction.guild.id});

                    if(guild.users.find(us => us.id === discordUser.id))
                    {
                        const guildUser = guild.users.find(us => us.id === discordUser.id);

                        const embed = await statsEmbed(discordUser,guildUser);
                        
                        await interaction.channel.send({content:"Here your stats !",embeds:[embed]});
                    }
                    
                }
                else if(interaction.options.getSubcommand() === "server")
                {
                    if(!interaction.memberPermissions.has("ADMINISTRATOR"))
                    {
                        await interaction.reply({content:"you don't have the permission to do that !",ephemeral:true});
                    }
                }
                else if(interaction.options.getSubcommand() === "messages")
                {
                    if(!interaction.memberPermissions.has("ADMINISTRATOR"))
                    {
                        await interaction.reply({content:"you don't have the permission to do that !",ephemeral:true});
                    }
                }
            }
            catch(error)
            {
                console.log(error);
            }
    }
}