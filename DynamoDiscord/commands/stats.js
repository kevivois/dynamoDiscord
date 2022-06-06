
// Importations utiles pour le projet
//=====================================


const Discord = require("discord.js");
const { Collection, MongoClient } = require("mongodb");
const { SlashCommandBuilder,SlashCommandStringOption  } = require('@discordjs/builders');
const {CanvasRenderService} = require("chartjs-node-canvas"); 
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const  config = require("../config.json");
const { default: QuickChart } = require("quickchart-js");
const {MessageAttachment} = require("discord.js")
const { ChartJSNodeCanvas,ChartJSNodeCanvasOptions } = require('chartjs-node-canvas');
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
    async execute(interaction,args,dbclient)    // fonction d'execution
    {
        var date = new Date(Date.now());    // date actuelle

      /**
       * @param {any{}} guildUser   // utilisateur de la BDD
       */
        const activesHours = async (guildUser) =>   // methode retournant les tranches d'heures quand l'utilisateur est le plus actif
        {
          var sliceHours = [{h:0,l:[]},{h:3,l:[]},{h:6,l:[]},{h:9,l:[]},{h:12,l:[]},{h:15,l:[]},{h:18,l:[]},{h:21,l:[]}];   // liste contenant les tranches d'heures vides
          const messages = guildUser.messages;
          for(var msg of messages)        // boucle sur chaque message
          {
            const date = new Date(msg.date);  // date du message
            const hour = date.getHours();   // heure du message
            for(i = 3; i <= 24;i+= 3) // boucle sur les tranches d'heures
            {
              if(hour >= i && hour  < i+3 ) // test sur quel tranche d'heure le message à été écris
              {
                var obj = sliceHours.find(hh => i == hh.h);   // récuperation de la tranchde d'heire
                if(i == 24)
                {
                  obj = sliceHours.find(hh => hh.h == 0);
                }
                sliceHours.at(sliceHours.indexOf(obj)).l.push({t:date})   // ajout de la date de l'heure du message dans la tranche d'heure
              }
            }     
          }
          var max = sliceHours[0];    // tranche d'heure avec le plus de messages
         sliceHours.forEach(slc => {    //determination de la tranche d'heure avec le plus de messages
            if(slc.l.length > max.l.length)
            {
              max = slc;
            }
         })
          var sum = 0;    // sommme des heures des messages en minutes
          max.l.forEach(m => {   // boucle sur la tranche d'heure avec le plus de messages
            // console.log (new Date(m.t).toTimeString());
            date = new Date(m.t);
            sum += (date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60);    // ajout de l'heure du messages
            
          })
          var avg = sum / max.l.length - 1;    // moyenne de l'heure en minute
          
          const realAvg = (Math.floor(avg / 60)) + ":" + Math.floor(avg % 60) + ":" + Math.floor((avg % 60 - parseInt(avg % 60))*60);   // moyennne en heures
          return await {sliceHours,maximum:max.h,average:realAvg}
        }

        /**
         * 
         * @param {String[]} labels 
         * @param {number[]} data 
         */
        const renderChart = async (data) =>   // methode permettant d'afficher un graphique en fonction de données
        {
          const chart = {
            type: 'bar',
            data: {
              labels: [0,3,6,9,12,15,18,21],
              datasets: [{
                label: 'Activitée ( % )',
                data: data
              }]
            },
            options: {
              scales:{
                yAxes: [{
                  ticks: {
                    min: 0,
                    max: 100,
                    stepSize: 20
                  }
                }]
              }
            }
          }

          const encodedChart = encodeURIComponent(JSON.stringify(chart));
          const chartUrl = `https://quickchart.io/chart?c=${encodedChart}&backgroundColor=white`;   // url du graphique
         

          return chartUrl;
          
        }
        /**
         * 
         * @param {Discord.GuildMember} discordUser utilisateur de discord
         * @param {any{}} guildUser utilisateur de la base de donnée
         */
        const statsEmbed = async (discordUser,guildUser) => {   // methode affichant l'embed de statistiques
            const joinedAt = new Date(discordUser.joinedAt);    // quand l'utilisateur à rejoins le serveur
            const dateToString = `${joinedAt.getDay()}.${joinedAt.getMonth()}.${joinedAt.getFullYear().toString().substring(1,3)}`  //
            const difference =  new Date(Date.now()).getTime() - joinedAt.getTime();    // difference entre la date actuelle et la date quand l'utilisateur à rejoins
            var days = Math.ceil(difference / (1000 * 3600 * 24));    // difference en jours
            const mostActivesHours = await activesHours(guildUser); // recuperation de la tranche d'heure la plus active
            const average = Math.round((guildUser.messages.length / days)*100)/100; // moyenne de messages depuis l'arrivée de l'utilisatuer
            const chartData = [];   // donne pour le graphique
            var totalMessages = 0;    // messages totaux
            for(const t of mostActivesHours.sliceHours)   // calcul du nombre de messages totaux
            { totalMessages += t.l.length;
            }
            for(const t of mostActivesHours.sliceHours)
            { chartData.push((t.l.length/totalMessages)*100);   // ajout des données pour le graphique
            }
            const chart = await renderChart(chartData);     // récuperation du graphique
            const embed = await {   //embed affichant les statistiques pour l'utilisatueur
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
                    "value": `Vous avez écris ${guildUser.messages.length} messages`    // affichage du nombre de messages
                  },
                  {
                    "name": "Activitée",
                    "value": `Cela fait une moyenne ${average} messages par jour depuis votre arrivée ( ${discordUser.joinedAt.toLocaleDateString("fr-FR")}) \n
                    Vous êtes le plus actifs entre ${mostActivesHours.maximum} et ${mostActivesHours.maximum + 3 } heures, en moyenne ${mostActivesHours.average}` // moyenne
                  },
                ],
                "image":{
                  "name": "Graphique",
                  "url":chart   // affichage du graphique
                }
            }
              return embed;
        };

        /**
         * 
         * @param {WithId<Document>} guild 
         * @param {Discord.Guild} discordGuild 
         * @returns 
         */
        const usersMessagesListEmbed = async (guild,discordGuild) => {    //fonction pour afficher un embed de list de messages
         const data = [];   // donnees pour l'algorythme
         for(const user of guild.users)
         {
           data.push({user:user.id,amount:user.messages.length})    // ajout des données
         };
         data.sort((a,b) => a.amount - b.amount);   // trie pour classer par nombres de messages
         data.reverse();
        const stringDatas = [];
        const ToStringData = async (dt) =>  {
            const user = await discordGuild.members.fetch((String(dt.user).toString()));
          stringDatas.push({name:user.displayName,value:String("Messages : " + dt.amount),inline:false})    //donnees affichées dans l'embed
        } 
        try
        {
          for(const dt of data)
        {
          await ToStringData(dt);   // ajout des données
        }
      }
      catch(error)
      {
        console.log(error);
      }
        const embed = await { // creation de l'embed
          "title": `Messages leaderboard`,
          "color": 8192236,
          "timestamp": `${new Date(Date.now()).toLocaleDateString("fr-FR")}`,   // date actuelle
          "footer": {
            "icon_url": `${discordGuild.client.user.avatarURL({format:"png",size:4096})}`,    // photo de profile du bot
            "text": `${discordGuild.client.user.username} | ${new Date(Date.now()).toLocaleDateString("fr-FR")}`   // nom du bot et date actuelle
          },
          "author": {
            "name": `${interaction.user.username}`,   // nom de l'utilisateur
            "icon_url": `${interaction.user.avatarURL({size:4096,format:"png"})}`   //photo de profile de l'utilisateur
          },
          "fields":stringDatas,
        }
            
            return embed;
      };

        try
        {

        
            
             
                const guild = await dbclient.db(dbName).collection(collectionName).findOne({id:interaction.guild.id});

                if(interaction.options.getSubcommand() === "me")  // affichage des statistiques propres à l'utilisateur
                {
                    
                    const discordUser = interaction.member;   // utilisateur discord
                    
                    
                   

                    if(guild.users.find(us => us.id === discordUser.id))    // verifier si la base de donnée contient l'utilisateur
                    {
                        const guildUser = guild.users.find(us => us.id === discordUser.id);   // utilisateur de la base de donnée

                        const embed = await statsEmbed(discordUser,guildUser);    // recuperation de l'embed
                        
                        await interaction.reply({content:`\n`,embeds:[embed]});   // affichage de l'embed dans la réponse du message
                    }
                    
                }
                else if(interaction.options.getSubcommand() === "messages") // affichage de la liste des messages
                {
                  const embed = await usersMessagesListEmbed(guild,interaction.guild);    // récuperation de l'embed
                  
                    if(!interaction.memberPermissions.has("ADMINISTRATOR"))   // si l'utilisateur est adminstrateur
                    {
                        await interaction.reply({content:"you don't have the permission to do that !",ephemeral:true});   // affichae du message si l'utilisateur n'est pas admin
                    }
                    
                    
                      await interaction.reply({content:"\n",embeds:[embed]}); // affichage de l'embed dans la réponse du message
                    
                   
                }
            }
            catch(error)
            {
                console.log(error);   // si'l y a des erreurs , le programme de s'arrête pas grâce au try catch
            } 
    }
}   // ne pas oublier l'accolade de fin