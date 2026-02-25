const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const { message } = req.body;

            if (message && message.text) {
                const chatId = message.chat.id;
                const text = message.text;

                if (/tiktok\.com/i.test(text)) {
                    await bot.sendMessage(chatId, '🔍 جاري معالجة رابط تيك توك...');
                    
                    // استخدام API خارجي (تأكد من فعاليته)
                    const response = await axios.get(`https://api.douyin.wtf/api?url=${encodeURIComponent(text)}`);
                    const videoUrl = response.data?.video_data?.nwm_video_url;

                    if (videoUrl) {
                        await bot.sendVideo(chatId, videoUrl, { caption: '✅ تم التحميل!' });
                    } else {
                        await bot.sendMessage(chatId, '❌ فشل العثور على الفيديو.');
                    }
                } else {
                    await bot.sendMessage(chatId, 'أرسل رابط تيك توك صالح.');
                }
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    res.status(200).send('OK');
};
