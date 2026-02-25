const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;

// إنشاء نسخة البوت بدون Polling ليتناسب مع Vercel
const bot = new TelegramBot(token, { polling: false });

// دالة لجلب الفيديو من TikTok باستخدام TikWM API (أكثر استقراراً)
async function downloadTikTokVideo(url) {
    try {
        const response = await axios.post('https://www.tikwm.com/api/', {
            url: url
        });

        if (response.data && response.data.data) {
            // نفضل رابط الفيديو بدون علامة مائية (play)
            return response.data.data.play;
        }
        return null;
    } catch (error) {
        console.error("TikTok API Error:", error.message);
        return null;
    }
}

// الدالة الأساسية لمعالجة الطلبات من Vercel
module.exports = async (req, res) => {
    try {
        // التأكد من أن الطلب قادم من تليجرام (POST)
        if (req.method === 'POST') {
            const update = req.body;

            if (update && update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const messageText = update.message.text;

                // تعبيرات نمطية للروابط
                const tiktokRegex = /tiktok\.com/i;
                const instagramRegex = /instagram\.com/i;

                if (tiktokRegex.test(messageText)) {
                    await bot.sendMessage(chatId, '🔍 جاري معالجة رابط تيك توك، انتظر قليلاً...');

                    const videoUrl = await downloadTikTokVideo(messageText);

                    if (videoUrl) {
                        // إرسال الفيديو مباشرة عبر الرابط لتجنب استهلاك موارد السيرفر
                        await bot.sendVideo(chatId, videoUrl, { 
                            caption: '✅ تم التحميل بواسطة بوتك الخاص!',
                            reply_to_message_id: update.message.message_id 
                        });
                    } else {
                        await bot.sendMessage(chatId, '❌ عذراً، فشل استخراج الفيديو. تأكد أن الحساب ليس خاصاً (Private).');
                    }

                } else if (instagramRegex.test(messageText)) {
                    await bot.sendMessage(chatId, '🚀 ميزة انستغرام سيتم إضافتها قريباً في التحديث القادم.');
                } else if (messageText === '/start') {
                    await bot.sendMessage(chatId, 'أهلاً بك! 👋\nأرسل لي رابط فيديو من تيك توك وسأقوم بتحميله لك بدون علامة مائية.');
                }
            }
        }
    } catch (error) {
        console.error('General Error:', error.message);
    }

    // يجب دائماً إرسال استجابة 200 لتليجرام حتى لا يكرر إرسال الرسالة
    res.status(200).send('OK');
};
