const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

// دالة التحميل الموحدة (تستخدم Cobalt API القوي جداً)
async function downloadMedia(url) {
    try {
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720", // جودة الفيديو
            isAudioOnly: false,
            filenamePattern: "basic"
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.url) {
            return response.data.url;
        }
        return null;
    } catch (error) {
        console.error("Download Error:", error.message);
        return null;
    }
}

module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            const update = req.body;
            if (update && update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text;

                // استخراج الرابط
                const urlMatch = text.match(/\bhttps?:\/\/\S+/gi);
                if (!urlMatch) return res.status(200).send('OK');
                const cleanUrl = urlMatch[0];

                if (/tiktok\.com|instagram\.com/i.test(cleanUrl)) {
                    await bot.sendMessage(chatId, '🚀 جاري التحميل باستخدام المحرك الجديد... انتظر ثوانٍ.');

                    const mediaUrl = await downloadMedia(cleanUrl);

                    if (mediaUrl) {
                        try {
                            // إرسال كفيديو
                            await bot.sendVideo(chatId, mediaUrl, { 
                                caption: '✅ تم التحميل بنجاح!',
                                reply_to_message_id: update.message.message_id 
                            });
                        } catch (e) {
                            // إذا كان الملف كبيراً جداً، نرسل الرابط مباشرة
                            await bot.sendMessage(chatId, `⚠️ الملف كبير جداً لرفعه مباشرة، يمكنك تحميله من هنا:\n${mediaUrl}`);
                        }
                    } else {
                        await bot.sendMessage(chatId, '❌ المحرك لم يستطع جلب الفيديو. قد يكون المنشور خاصاً أو الرابط غير مدعوم.');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Bot Error:', error.message);
    }
    res.status(200).send('OK');
};
