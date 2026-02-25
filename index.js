const TelegramBot = require('node-telegram-bot-api');

// استبدل 'YOUR_TELEGRAM_BOT_TOKEN' بالتوكن الخاص ببوتك
const token = '8418864078:AAHfUHd5gkfxiUJNP6Bub66zsvBSFFDzbfM';

// إنشاء البوت باستخدام وضع "polling" لجلب التحديثات الجديدة
const bot = new TelegramBot(token, {polling: true});

// هذا الأمر يستمع لأي نوع من الرسائل
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // إرسال رسالة إلى المستخدم تفيد باستلام رسالته
  bot.sendMessage(chatId, 'تم استلام رسالتك');
});

console.log('البوت قيد التشغيل...');
