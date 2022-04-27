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
        var sliceHours = [{h:0,l:[]},{h:3,l:[]},{h:6,l:[]},{h:9,l:[]},{h:12,l:[]},{h:15,l:[]},{h:18,l:[]},{h:21,l:[]}];


      /**
       * @param {any{}} guildUser
       */
        const activesHours = async (guildUser) =>
        {
          const messages = guildUser.messages;

          for(var msg of messages)
          {
            const date = new Date(msg.date);
            const hour = date.getHours();
           
            for(i = 3; i <= 24;i+= 3)
            {
              
              if(hour >= i && hour  < i+3 )
              {
                
                var obj = sliceHours.find(hh => i == hh.h);

                if(i == 24)
                {
                  obj = sliceHours.find(hh => hh.h == 0);
                }
                
               // var nextObj = sliceHours.find(hh => (i+3) == hh.h);
                
                sliceHours.at(sliceHours.indexOf(obj)).l.push({t:date})
                
              }
            }

           // get most active hour

           
          }
          
          var max = sliceHours[0];
         sliceHours.forEach(slc => {
            if(slc.l.length > max.l.length)
            {
              max = slc;
            }
            console.log(max.h);
         })
        var sum = 0;
         max.l.forEach(m => {
          // console.log (new Date(m.t).toTimeString());
          date = new Date(m.t);
           sum += (date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60);
           
         })
         var avg = sum / max.l.length - 1;
         
         const realAvg = (Math.floor(avg / 60)) + ":" + Math.floor(avg % 60) + ":" + Math.floor((avg % 60 - parseInt(avg % 60))*60);
         //console.log((avg/60 - parseInt(avg/60))*60);
         
         return await {maximum:max.h,average:realAvg}

        }
        /**
         * 
         * @param {Discord.GuildMember} discordUser utilisateur de discord
         * @param {any{}} guildUser utilisateur de la base de donnée
         */
        const statsEmbed = async (discordUser,guildUser) => {
            const joinedAt = new Date(discordUser.joinedAt);
            const dateToString = `${joinedAt.getDay()}.${joinedAt.getMonth()}.${joinedAt.getFullYear().toString().substring(1,3)}`
            const difference =  new Date(Date.now()).getTime() - joinedAt.getTime();
            
            var days = Math.ceil(difference / (1000 * 3600 * 24));
            const mostActivesHours = await activesHours(guildUser);
            const average = Math.round((guildUser.messages.length / days)*100)/100;
           // console.log(discordUser.user.avatarURL({size:4096,format:"png"}),interaction.guild.client.user.avatarURL({format:"png",size:4096}));
            
            const embed = await {
                "title": `Here your stats `,
                "url": "https://discordapp.com",
                "color": 8192236,
                "timestamp": `${new Date(Date.now()).toLocaleDateString("fr-FR")}`,
                "footer": {
                  "icon_url": `${interaction.guild.client.user.avatarURL({format:"png",size:4096})}`,
                  "text": `${interaction.guild.client.user.username} | ${new Date(Date.now()).toLocaleDateString("fr-FR")}`
                },
                "author": {
                  "name": `${discordUser.user.username}`,
                  "url":"https://discordapp.com",
                  "icon_url": `${discordUser.user.avatarURL({size:4096,format:"png"})}`
                },
                "fields": [
                  {
                    "name": "messages",
                    "value": `Vous avez écris ${guildUser.messages.length} messages depuis votre arrivée`
                  },
                  {
                    "name": "Activitée",
                    "value": `Cela fait une moyenne ${average} messages par jour depuis votre arrivée ( ${discordUser.joinedAt.toLocaleDateString("fr-FR")}) \n
                    Vous êtes le plus actifs entre ${mostActivesHours.maximum} et ${mostActivesHours.maximum + 3 } heures, en moyenne ${mostActivesHours.average}`
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
                    
                    const discordUser = interaction.member;
                    
                    
                    const guild = await dbclient.db(dbName).collection(collectionName).findOne({id:interaction.guild.id});

                    if(guild.users.find(us => us.id === discordUser.id))
                    {
                        const guildUser = guild.users.find(us => us.id === discordUser.id);

                        const embed = await statsEmbed(discordUser,guildUser);
                        
                        await interaction.reply({content:`\n`,embeds:[embed]});
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