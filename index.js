const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

// دالة جلب فيديو تيك توك (تعمل بشكل ممتاز)
async function downloadTikTok(url) {
    try {
        const res = await axios.post('https://www.tikwm.com/api/', { url: url });
        return res.data?.data?.play || null;
    } catch (e) { return null; }
}

// دالة جلب ميديا انستقرام (تحديث جديد لمواجهة مشكلة الحساب الخاص)
async function downloadInstagram(url) {
    try {
        // نستخدم API بديل (SnapInsta API) عبر محرك خارجي
        const res = await axios.get(`https://api.vkrhost.com/api/instagram/download?url=${encodeURIComponent(url)}`);
        
        if (res.data && res.data.data && res.data.data.length > 0) {
            // نأخذ الرابط المباشر
            return res.data.data[0].url;
        }
        return null;
    } catch (e) {
        console.error("Instagram Error:", e.message);
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

                // تنظيف الرابط من أي نص إضافي
                const urlMatch = text.match(/\bhttps?:\/\/\S+/gi);
                if (!urlMatch) return res.status(200).send('No URL');
                const cleanUrl = urlMatch[0];

                if (/tiktok\.com/i.test(cleanUrl)) {
                    await bot.sendMessage(chatId, '⏳ جاري جلب فيديو تيك توك...');
                    const video = await downloadTikTok(cleanUrl);
                    if (video) {
                        await bot.sendVideo(chatId, video, { caption: '✅ تيك توك' });
                    } else {
                        await bot.sendMessage(chatId, '❌ فشل التحميل من تيك توك.');
                    }
                } 
                
                else if (/instagram\.com/i.test(cleanUrl)) {
                    await bot.sendMessage(chatId, '⏳ جاري جلب ميديا انستقرام...');
                    const mediaUrl = await downloadInstagram(cleanUrl);
                    
                    if (mediaUrl) {
                        // محاولة إرسال كفيديو أولاً، إذا فشل نرسله كصورة
                        try {
                            await bot.sendVideo(chatId, mediaUrl, { caption: '✅ انستقرام' });
                        } catch (err) {
                            await bot.sendPhoto(chatId, mediaUrl, { caption: '✅ انستقرام' });
                        }
                    } else {
                        await bot.sendMessage(chatId, '❌ فشل التحميل. إنستغرام يرفض الطلب حالياً، جرب رابطاً آخر أو تأكد أن الفيديو ليس "Story".');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    res.status(200).send('OK');
};
