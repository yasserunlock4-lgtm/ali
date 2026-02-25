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
      
      // التأكد من أن الـ API أعادت رابط فيديو
      if (response.data && response.data.video_data && response.data.video_data.nwm_video_url) {
        return response.data.video_data.nwm_video_url;
      } else {
        throw new Error('لم يتم العثور على رابط فيديو بدون علامة مائية.');
      }
    } catch (error) {
      console.error("TikTok download error:", error.message);
      return null; // إرجاع null في حالة الفشل
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
          // إرسال رسالة "جاري المعالجة"
          await bot.sendMessage(chatId, '🔍 جاري البحث عن الفيديو، يرجى الانتظار...');

          const videoUrl = await downloadTikTokVideo(messageText);

          if (videoUrl) {
            // إذا نجح التحميل، أرسل الفيديو
            await bot.sendVideo(chatId, videoUrl, { caption: '✅ تم التحميل بنجاح!' });
          } else {
            // إذا فشل التحميل، أرسل رسالة خطأ
            await bot.sendMessage(chatId, '❌ عذراً، لم أتمكن من تحميل هذا الفيديو. قد يكون الرابط غير صحيح أو الفيديو خاص.');
          }
        } else if (messageText.includes('instagram.com')) {
            await bot.sendMessage(chatId, 'ميزة التحميل من انستغرام قيد التطوير حالياً. 👨‍💻');
        }
        else {
          // رسالة ترحيبية إذا لم يكن الرابط من تيك توك
          await bot.sendMessage(chatId, 'أهلاً بك! 👋\n\nأرسل لي رابط فيديو من تيك توك لتحميله.');
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing update:', error.message);
      res.status(200).send('Error processing update');
    }
  };
}
