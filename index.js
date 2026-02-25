const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error("Fatal Error: BOT_TOKEN is not defined.");
    module.exports = (req, res) => res.status(200).send('OK - Bot not configured');
} else {
    const bot = new TelegramBot(token);

    // دالة لتوسيع الروابط المختصرة (مثل vm.tiktok.com)
    async function expandShortUrl(url) {
        try {
            const response = await axios.head(url, { maxRedirects: 5 });
            return response.request.res.responseUrl;
        } catch (error) {
            return url; // إذا فشل التوسيع، أعد الرابط الأصلي
        }
    }

    // دالة لتحميل الفيديو من تيك توك
    async function downloadTikTokVideo(url) {
        try {
            const response = await axios.get(`https://api.douyin.wtf/api?url=${url}` );
            if (response.data && response.data.video_data && response.data.video_data.nwm_video_url) {
                return response.data.video_data.nwm_video_url;
            }
            throw new Error('لم يتم العثور على رابط فيديو بدون علامة مائية.');
        } catch (error) {
            console.error("TikTok download error:", error.message);
            return null;
        }
    }

    module.exports = async (req, res) => {
        try {
            const update = req.body;
            
            // --- سجل تشخيصي ---
            console.log("Received update:", JSON.stringify(update, null, 2));

            if (update && update.message && update.message.text) {
                const chatId = update.message.chat.id;
                let messageText = update.message.text;

                // استخدام تعبير نمطي (Regex) للتحقق من وجود رابط تيك توك
                const tiktokRegex = /tiktok\.com/i;
                const instagramRegex = /instagram\.com/i;

                if (tiktokRegex.test(messageText)) {
                    await bot.sendMessage(chatId, '🔍 تم استلام الرابط، جاري المعالجة...');
                    
                    // توسيع الرابط إذا كان مختصرًا
                    const fullUrl = await expandShortUrl(messageText);
                    console.log(`Expanded URL: ${fullUrl}`); // سجل تشخيصي للرابط الكامل

                    const videoUrl = await downloadTikTokVideo(fullUrl);

                    if (videoUrl) {
                        await bot.sendVideo(chatId, videoUrl, { caption: '✅ تم التحميل بنجاح!' });
                    } else {
                        await bot.sendMessage(chatId, '❌ عذراً، لم أتمكن من تحميل هذا الفيديو. قد يكون الرابط غير صحيح أو الفيديو خاص.');
                    }
                } else if (instagramRegex.test(messageText)) {
                    await bot.sendMessage(chatId, 'ميزة التحميل من انستغرام قيد التطوير حالياً. 👨‍💻');
                } else {
                    await bot.sendMessage(chatId, 'أهلاً بك! 👋\n\nأرسل لي رابط فيديو من تيك توك أو إنستغرام لتحميله.');
                }
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Error processing update:', error.message);
            res.status(200).send('Error processing update');
        }
    };
}
