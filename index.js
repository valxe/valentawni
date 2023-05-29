const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const request = require('request');
const fs = require('fs');

const config = require('./settings.json');
const express = require('express');
const app = express();

function sendDiscordMessage(content) {
  const webhookURL = 'https://discord.com/api/webhooks/1107581014420758568/ATFoLkSItJTUN4tuDVnN5fCXBthPlBnTA1yAwit8EHXhhA8Kd4Owxebfkax5mfgve49k';

  const currentTime = new Date().toLocaleTimeString('fr-FR', {
    timeZone: 'Europe/Paris'
  });

  const payload = {
    embeds: [{
      description: content,
      footer: {
        text: `${currentTime}`
      }
    }]
  };

  request.post({
    url: webhookURL,
    body: payload,
    json: true
  }, function(error, response, body) {
  });
}
app.get('/', (req, res) => {
  res.send('skeetless')
});

app.listen(3000, () => {
});

function createBot() {
   const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      auth: config['bot-account']['type'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version,
   });

   bot.loadPlugin(pathfinder);
   const mcData = require('minecraft-data')(bot.version);
   const defaultMove = new Movements(bot, mcData);
   bot.settings.colorsEnabled = false;

  let messageCount = 0;

  function updateMessageCount() {
    fs.writeFile('count.txt', messageCount.toString(), (err) => {
      if (err) {
      } else {
      }
    });
  }

  function retrieveMessageCount() {
    fs.readFile('count.txt', 'utf8', (err, data) => {
      if (err) {
      } else {
        const count = parseInt(data);
        if (!isNaN(count)) {
          messageCount = count;
          console.log('Total recorded message:', messageCount);
        }
      }
    });
  }

  retrieveMessageCount();

   bot.once('spawn', () => {
      console.log('\x1b[33m[BotLog] Bot joined to the server', '\x1b[0m');

      if (config.utils['auto-auth'].enabled) {
         console.log('[INFO] Started auto-auth module');

         var password = config.utils['auto-auth'].password;
         setTimeout(() => {
            bot.chat(`/register ${password} ${password}`);
            bot.chat(`/login ${password}`);
         }, 500);

         console.log(`[Auth] Authentification commands executed.`);
      }

      if (config.utils['chat-messages'].enabled) {
         console.log('[INFO] Started chat-messages module');
         var messages = config.utils['chat-messages']['messages'];

         if (config.utils['chat-messages'].repeat) {
            var delay = config.utils['chat-messages']['repeat-delay'];
            let i = 0;
           
            let msg_timer = setInterval(() => {
               bot.chat(`${messages[i]}`);

               if (i + 1 == messages.length) {
                  i = 0;
               } else i++;
            }, delay * 1000);
         } else {
            messages.forEach((msg) => {
               bot.chat(msg);
            });
         }
      }

      const pos = config.position;

      if (config.position.enabled) {
         console.log(
            `\x1b[32m[BotLog] Starting moving to target location (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`
         );
         bot.pathfinder.setMovements(defaultMove);
         bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
      }

      if (config.utils['anti-afk'].enabled) {
         bot.setControlState('jump', false);
         if (config.utils['anti-afk'].sneak) {
            bot.setControlState('sneak', true);
         }
      }
   });

   bot.on('chat', (username, message) => {
  if (username === 'to') {
    return;
  }
  if (username === '8b8t') {
    return;
  }
  if (username === 'queue') {
    return;
  }
  if (username === 'color') {
    return;
  }
  if (username === 'command') {
    return;
  }
  if (username === 'gratis') {
    return;
  }
  if (config.utils['chat-log']) {
    console.log(`\x1b[32m[ChatLog] ${username} : ${message}`);
  }
  const content = `${username} : ${message}`;
  sendDiscordMessage(content);
  messageCount++;
   updateMessageCount();
   });

   bot.on('goal_reached', () => {
      console.log(
         `\x1b[32m[BotLog] Bot arrived to target location. ${bot.entity.position}\x1b[0m`
      );
   });

   bot.on('death', () => {
      console.log(
         `\x1b[33m[BotLog] Bot has been died and was respawned ${bot.entity.position}`,
         '\x1b[0m'
      );
   });

   if (config.utils['auto-reconnect']) {
      bot.on('end', () => {
         setTimeout(() => {
            createBot();
         }, config.utils['auto-recconect-delay']);
      });
   }

   bot.on('kicked', (reason) =>
      console.log(
         '\x1b[33m',
         `[BotLog] Bot was kicked from the server. Reason: \n${reason}`,
         '\x1b[0m'
      )
   );
   bot.on('error', (err) =>
      console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m')
   );
}

createBot();