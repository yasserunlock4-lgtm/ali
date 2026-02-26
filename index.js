const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const app = express();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

app.use(express.json());

// نفس دالة التحميل (Cobalt) التي أعطيتك إياها سابقاً
async function downloadMedia(url) {
    try {
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vQuality: "720"
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        return response.data?.url || null;
    } catch (e) { return null; }
}

// نقطة استقبال الرسائل من تليجرام
app.post(`/bot${token}`, async (req, res) => {
    const update = req.body;
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (/tiktok\.com|instagram\.com/i.test(text)) {
            await bot.sendMessage(chatId, '⏳ جاري التحميل... (Render أسرع وأقوى)');
            const mediaUrl = await downloadMedia(text);
            if (mediaUrl) {
                await bot.sendVideo(chatId, mediaUrl, { caption: '✅ تم التحميل!' });
            } else {
                await bot.sendMessage(chatId, '❌ فشل التحميل.');
            }
        }
    }
    res.sendStatus(200);
});

// تشغيل السيرفر على المنفذ الذي يحدده Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
