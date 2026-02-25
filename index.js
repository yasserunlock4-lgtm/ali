const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios'); // استدعاء مكتبة axios

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("Fatal Error: BOT_TOKEN is not defined.");
  module.exports = (req, res) => res.status(200).send('OK - Bot not configured');
} else {
  const bot = new TelegramBot(token);

  // دالة لتحميل الفيديو من تيك توك
  async function downloadTikTokVideo(url) {
    try {
      // نستخدم API خارجية بسيطة للتحميل
      const response = await axios.get(`https://api.douyin.wtf/api?url=${url}` );
      
      if (response.data && response.data.video_data && response.data.video_data.nwm_video_url) {
        return response.data.video_data.nwm_video_url;
      } else {
        // محاولة استخدام رابط آخر إذا فشل الأول
        if (response.data && response.data.video_data && response.data.video_data.wm_video_url) {
            return response.data.video_data.wm_video_url;
        }
        throw new Error('لم يتم العثور على رابط فيديو صالح.');
      }
    } catch (error) {
      console.error("TikTok download error:", error.message);
      return null;
    }
  }

  module.exports = async (req, res) => {
    try {
      const update = req.body;

      if (update && update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const messageText = update.message.text;

        // التحقق مما إذا كانت الرسالة تحتوي على رابط تيك توك
        if (messageText.includes('tiktok.com')) {
          await bot.sendMessage(chatId, '🔍 جاري البحث عن الفيديو، يرجى الانتظار...');
          const videoUrl = await downloadTikTokVideo(messageText);

          if (videoUrl) {
            await bot.sendVideo(chatId, videoUrl, { caption: '✅ تم التحميل بنجاح!\n\n بواسطة بوت @YourBotUsername' }); // يمكنك تغيير اسم المستخدم هنا
          } else {
            await bot.sendMessage(chatId, '❌ عذراً، لم أتمكن من تحميل هذا الفيديو. قد يكون الرابط غير صحيح أو الفيديو خاص.');
          }
        } 
        // التحقق من رابط انستغرام بشكل منفصل
        else if (messageText.includes('instagram.com')) {
            await bot.sendMessage(chatId, 'ميزة التحميل من انستغرام قيد التطوير حالياً. 👨‍💻');
        }
        // إذا لم تكن الرسالة رابط تيك توك أو انستغرام
        else {
          await bot.sendMessage(chatId, 'أهلاً بك! 👋\n\nأرسل لي رابط فيديو من تيك توك أو إنستغرام لتحميله.');
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing update:', error.message);
      // نرسل استجابة ناجحة لتجنب تكرار تليجرام للطلب
      res.status(200).send('Error processing update');
    }
  };
}
