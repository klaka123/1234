// =============================================
// ⚙️ КОНФИГУРАЦИЯ - ЗАПОЛНИ СВОИ ДАННЫЕ!
// =============================================

const CONFIG = {
    // 1. Replicate API токен (получить на replicate.com)
    // Регистрируйся, заходи в аккаунт -> API Tokens
    REPLICATE_API_TOKEN: "вставь_свой_токен_сюда",
    
    // 2. Версия модели Stable Diffusion XL
    // SDXL - лучшая бесплатная модель
    MODEL_VERSION: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    
    // 3. Настройки по умолчанию
    DEFAULT_STYLE: "фотореализм",
    DEFAULT_SIZE: 768,
    
    // 4. Telegram Bot токен (для отправки фото)
    // Получить у @BotFather
    BOT_TOKEN: "вставь_свой_бот_токен_сюда",
    
    // 5. API для отправки фото (не трогать!)
    TELEGRAM_API: "https://api.telegram.org/bot"
};

// Проверка конфигурации
function checkConfig() {
    if (CONFIG.REPLICATE_API_TOKEN.includes("вставь_свой")) {
        showNotification("⚠️ Вставь свой Replicate токен в config.js", 10000);
        return false;
    }
    return true;
}
