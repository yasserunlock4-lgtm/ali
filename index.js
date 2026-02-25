const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

// دالة جلب فيديو تيك توك
async function downloadTikTok(url) {
    try {
        const res = await axios.post('https://www.tikwm.com/api/', { url: url });
        return res.data?.data?.play || null;
    } catch (e) { return null; }
}

// دالة جلب ميديا انستقرام (Reels, Video, Photo)
async function downloadInstagram(url) {
    try {
        // نستخدم API خارجي مجاني للانستقرام
        const res = await axios.get(`https://api.vkrhost.com/api/instagram/download?url=${encodeURIComponent(url)}`);
        
        if (res.data && res.data.data && res.data.data.length > 0) {
            // نأخذ أول عنصر (فيديو أو صورة)
            return {
                url: res.data.data[0].url,
                type: res.data.data[0].type // سنعرف إذا كان 'video' أو 'image'
            };
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

                // --- معالجة تيك توك ---
                if (/tiktok\.com/i.test(text)) {
                    await bot.sendMessage(chatId, '⏳ جاري جلب فيديو تيك توك...');
                    const video = await downloadTikTok(text);
                    if (video) {
                        await bot.sendVideo(chatId, video, { caption: '✅ تم التحميل من تيك توك' });
                    } else {
                        await bot.sendMessage(chatId, '❌ فشل تحميل فيديو تيك توك.');
                    }
                } 
                
                // --- معالجة انستقرام ---
                else if (/instagram\.com/i.test(text)) {
                    await bot.sendMessage(chatId, '⏳ جاري جلب ميديا انستقرام...');
                    const media = await downloadInstagram(text);
                    if (media && media.url) {
                        if (media.type === 'video' || media.url.includes('.mp4')) {
                            await bot.sendVideo(chatId, media.url, { caption: '✅ تم تحميل الريلز/الفيديو' });
                        } else {
                            await bot.sendPhoto(chatId, media.url, { caption: '✅ تم تحميل الصورة' });
                        }
                    } else {
                        await bot.sendMessage(chatId, '❌ فشل التحميل. تأكد أن الحساب عام (Public) وليس خاصاً.');
                    }
                }
                
                // --- رسالة الترحيب ---
                else if (text === '/start') {
                    await bot.sendMessage(chatId, 'أهلاً بك! 👋\nأرسل رابط فيديو من تيك توك أو ريلز من انستقرام لتحميله فوراً.');
                }
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    res.status(200).send('OK');
};
