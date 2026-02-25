const TelegramBot = require('node-telegram-bot-api');

// قراءة التوكن من متغيرات البيئة
const token = process.env.BOT_TOKEN;
const vercelUrl = `https://ali-bice.vercel.app`; // رابط Vercel الخاص بك

const bot = new TelegramBot(token );

// هذا هو الجزء الذي سيعالج الطلبات القادمة من Vercel
module.exports = async (req, res) => {
  try {
    // استخراج التحديث من الطلب
    const update = req.body;

    // التأكد من وجود رسالة نصية
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;

      // الرد على المستخدم
      await bot.sendMessage(chatId, `لقد أرسلت: ${messageText}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing update:', error);
    res.status(500).send('Error');
  }
};

// هذا الجزء ضروري فقط للإعداد الأولي للـ Webhook (يمكن إبقاؤه)
// ملاحظة: لقد قمنا بتشغيل هذا الرابط يدويًا بالفعل
if (process.env.VERCEL_ENV === 'development') {
  bot.setWebHook(`${vercelUrl}/api/bot`);
}
