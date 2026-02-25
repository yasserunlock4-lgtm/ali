const TelegramBot = require('node-telegram-bot-api');

// قراءة التوكن من متغيرات البيئة. إذا لم يجده، سيتوقف بأمان.
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("Fatal Error: BOT_TOKEN is not defined in environment variables.");
  // نرسل استجابة ناجحة لتليجرام لمنع إعادة المحاولة، لكن نسجل الخطأ.
  module.exports = (req, res) => res.status(200).send('OK - Bot not configured');
} else {
  const bot = new TelegramBot(token);

  // هذا هو الجزء الذي سيعالج الطلبات القادمة من Vercel
  module.exports = async (req, res) => {
    try {
      // استخراج التحديث من الطلب
      const update = req.body;

      // التأكد من وجود رسالة وتصرف بناءً عليها
      if (update && update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        // الرد على المستخدم
        await bot.sendMessage(chatId, `لقد استلمت رسالتك: "${text}"`);
      }

      // إرسال استجابة ناجحة لتليجرام
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing update:', error.message);
      // حتى في حالة الخطأ، نرسل استجابة ناجحة لتجنب تكرار تليجرام للطلب
      res.status(200).send('Error processing update');
    }
  };
}
