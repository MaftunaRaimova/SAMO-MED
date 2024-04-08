const TelegramBot = require('node-telegram-bot-api');


const TOKEN = 'TOKEN';
const bot = new TelegramBot(TOKEN, {
    polling: {
        interval: 300,
        autoStart: true
      }
    
});


bot.on('contact', async msg => {
    if (msg.chat.id == msg.contact.user_id)
    {
    try
    {
        console.log(msg)
    }
    catch(error) 
    {
        console.log(error);
    }
} else {console.log('Это не ваш номер. Попробуйте еще раз.')}
})

