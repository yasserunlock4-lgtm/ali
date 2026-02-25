const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

// دالة تحميل تيك توك
async function downloadTikTok(url) {
    try {
        const res = await axios.post('https://www.tikwm.com/api/', { url: url });
        return res.data?.data?.play || null;
    } catch (e) { return null; }
}

// دالة تحميل انستغرام - محرك جديد وقوي
async function downloadInstagram(url) {
    try {
        // نستخدم API بديل يدعى Snapinsta/SaveFrom عبر وسيط مستقر
        const res = await axios.get(`https://api.diego-pro-apis.online/api/v1/instagram/download?url=${encodeURIComponent(url)}`);
        
        // التحقق من استجابة الـ API الجديد
        if (res.data && res.data.data && res.data.data.length > 0) {
            return {
                url: res.data.data[0].url,
                type: res.data.data[0].type || 'video'
            };
        }
        return null;
    } catch (e) {
        // محاولة ثانية بـ API احتياطي في حال فشل الأول
        try {
            const backupRes = await axios.get(`https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`);
            if (backupRes.data?.data?.[0]?.url) {
                return { url: backupRes.data.data[0].url, type: 'video' };
            }
        } catch (err) {
            console.error("All Instagram APIs failed");
        }
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

                // استخراج أول رابط فقط من الرسالة
                const urlMatch = text.match(/\bhttps?:\/\/\S+/gi);
                if (!urlMatch) return res.status(200).send('No URL');
                const cleanUrl = urlMatch[0];

                if (/tiktok\.com/i.test(cleanUrl)) {
                    await bot.sendMessage(chatId, '⏳ جاري التحميل من تيك توك...');
                    const video = await downloadTikTok(cleanUrl);
                    if (video) {
                        await bot.sendVideo(chatId, video, { caption: '✅ تم بواسطة بوتك' });
                    } else {
                        await bot.sendMessage(chatId, '❌ فشل تحميل فيديو تيك توك.');
                    }
                } 
                
                else if (/instagram\.com/i.test(cleanUrl)) {
                    await bot.sendMessage(chatId, '⏳ جاري التحميل من انستقرام (قد يستغرق لحظات)...');
                    const media = await downloadInstagram(cleanUrl);
                    
                    if (media && media.url) {
                        try {
                            // إرسال الميديا بناءً على نوعها
                            if (media.type === 'image' || media.url.includes('.jpg') || media.url.includes('.png')) {
                                await bot.sendPhoto(chatId, media.url, { caption: '✅ تم تحميل الصورة' });
                            } else {
                                await bot.sendVideo(chatId, media.url, { caption: '✅ تم تحميل الفيديو' });
                            }
                        } catch (sendErr) {
                            // إذا فشل الإرسال كفيديو (بسبب الصيغة)، نرسله كرابط مباشر
                            await bot.sendMessage(chatId, `✅ تم استخراج الرابط المباشر:\n${media.url}`);
                        }
                    } else {
                        await bot.sendMessage(chatId, '❌ معذرة! إنستغرام يفرض قيوداً على هذا الرابط حالياً. جرب رابط منشور آخر.');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    res.status(200).send('OK');
};
