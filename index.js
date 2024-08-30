// bot.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your own token from @BotFather
const token = '7227447533:AAGgFuiJfGFaz92tH4VJCEO4SmXeX-6e4C4';
const bot = new TelegramBot(token, { polling: true });

// Store user data
const userWatchLists = {};
const notifications = {};
const latestEpisodes = {};

// Start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Anime botiga xush kelibsiz! Mavjud buyruqlarni ko'rish uchun /help ni kiriting.");
});

// Help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Buyruqlar:\n/info [anime_nomi] - Anime haqida maʼlumot olish\n/add [anime_nomi] - Tomosha roʻyxatiga qoʻshish\n/remove [anime_nomi]-ni - Tomosha roʻyxatidan olib tashlash\n/watchlist - Tomosha roʻyxatini koʻrish\n/recommend - Tomosha roʻyxati asosida tavsiyalar oling\n/notify - Yangi epizodlar haqida bildirishnomalar oling.\n/stopnotify - Bildirishnomalarni toʻxtating.");
});

// API call to get anime information
const fetchAnimeInfo = async (animeName) => {
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeName)}`);
        return response.data.data[0]; // Return the first anime found
    } catch (error) {
        console.error(error);
        return null;
    }
};

// Info command
bot.onText(/\/info (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const animeName = match[1];
    const animeInfo = await fetchAnimeInfo(animeName);

    if (animeInfo) {
        const message = `**Title:** ${animeInfo.title}\n**Synopsis:** ${animeInfo.synopsis}\n**Episodes:** ${animeInfo.episodes}\n**Aired:** ${animeInfo.aired.string}\n**Score:** ${animeInfo.score}`;
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, "Kechirasiz, men bu anime haqida hech qanday ma'lumot topa olmadim.");
    }
});

// Add to watchlist
bot.onText(/\/add (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const animeName = match[1];

    if (!userWatchLists[chatId]) {
        userWatchLists[chatId] = [];
    }
    
    if (!userWatchLists[chatId].includes(animeName)) {
        userWatchLists[chatId].push(animeName);
        latestEpisodes[animeName] = 0; // Initialize latest episode tracking
        bot.sendMessage(chatId, `${animeName} tomosha roʻyxatingizga qoʻshildi.`);
    } else {
        bot.sendMessage(chatId, `${animeName} allaqachon tomosha ro'yxatingizda.`);
    }
});

// Remove from watchlist
bot.onText(/\/remove (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const animeName = match[1];

    if (userWatchLists[chatId]) {
        userWatchLists[chatId] = userWatchLists[chatId].filter(anime => anime !== animeName);
        delete latestEpisodes[animeName]; // Remove tracking for this anime
        bot.sendMessage(chatId, `${animeName} tomosha roʻyxatidan olib tashlandi.`);
    } else {
        bot.sendMessage(chatId, "Sizda tomosha roʻyxati yoʻq.");
    }
});

// View watch list
bot.onText(/\/watchlist/, (msg) => {
    const chatId = msg.chat.id;

    if (userWatchLists[chatId] && userWatchLists[chatId].length > 0) {
        const watchList = userWatchLists[chatId].join('\n');
        bot.sendMessage(chatId, `Tomosha roʻyxatingiz:\n${watchList}`);
    } else {
        bot.sendMessage(chatId, "Tomosha roʻyxatingiz boʻsh.");
    }
});

// Recommendations command
bot.onText(/\/recommend/, async (msg) => {
    const chatId = msg.chat.id;

    if (!userWatchLists[chatId] || userWatchLists[chatId].length === 0) {
        bot.sendMessage(chatId, "Tomosha roʻyxatingiz boʻsh. Tavsiyalarni olish uchun avvaliga anime qoʻshing.");
        return;
    }

    // Simple recommendation based on popular anime
    const recommendations = await fetchAnimeInfo("Naruto"); // Example of fetching a popular anime
    bot.sendMessage(chatId, `Sizga ham yoqishi mumkin: **${recommendations.title}**`, { parse_mode: 'Markdown' });
});

// Notify command for new episodes
bot.onText(/\/notify/, (msg) => {
    const chatId = msg.chat.id;

    if (!notifications[chatId]) {
        notifications[chatId] = setInterval(async () => {
            if (userWatchLists[chatId] && userWatchLists[chatId].length > 0) {
                for (const anime of userWatchLists[chatId]) {
                    const animeInfo = await fetchAnimeInfo(anime);
                    if (animeInfo && animeInfo.episodes > latestEpisodes[anime]) {
                        latestEpisodes[anime] = animeInfo.episodes; // Update latest episode
                        bot.sendMessage(chatId, `🎉 Yangi qism mavjud **${anime}**! Jami epizodlar: ${animeInfo.episodes}`, { parse_mode: 'Markdown' });
                    }
                }
            }
        }, 3600000); // Check every hour
        bot.sendMessage(chatId, "Endi siz har soatda yangi epizodlar haqida bildirishnoma olasiz.");
    } else {
        bot.sendMessage(chatId, "Siz allaqachon bildirishnomalarni olmoqdasiz.");
    }
});

// Stop notification command
bot.onText(/\/stopnotify/, (msg) => {
    const chatId = msg.chat.id;

    if (notifications[chatId]) {
        clearInterval(notifications[chatId]);
        delete notifications[chatId];
        bot.sendMessage(chatId, "Yangi epizodlar haqida bildirishnomalar toʻxtatildi.");
    } else {
        bot.sendMessage(chatId, "Siz bildirishnomalarni olmaysiz.");
    }
});

// Handle unknown commands
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text.startsWith('/')) {
        bot.sendMessage(chatId, "Noma'lum buyruq. Buyruqlar ro'yxati uchun /help ni kiriting.");
    }
});
