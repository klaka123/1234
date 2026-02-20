// =============================================
// 🚀 ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ
// =============================================

// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Состояние приложения
let currentStyle = CONFIG.DEFAULT_STYLE;
let currentSize = CONFIG.DEFAULT_SIZE;
let currentImageUrl = null;
let isGenerating = false;
let history = [];

// Загружаем историю из localStorage
loadHistory();

// Элементы DOM
const elements = {
    prompt: document.getElementById('prompt'),
    generateBtn: document.getElementById('generateBtn'),
    resultArea: document.getElementById('resultArea'),
    placeholder: document.getElementById('placeholder'),
    generatedImage: document.getElementById('generatedImage'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    loadingSubtext: document.getElementById('loadingSubtext'),
    actionButtons: document.getElementById('actionButtons'),
    sendBtn: document.getElementById('sendBtn'),
    apiStatus: document.getElementById('apiStatus'),
    historyGrid: document.getElementById('historyGrid')
};

// =============================================
// 🎨 ВЫБОР СТИЛЯ
// =============================================
document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        currentStyle = this.dataset.style;
    });
});

// =============================================
// 📏 ВЫБОР РАЗМЕРА
// =============================================
document.querySelectorAll('.size-option').forEach(opt => {
    opt.addEventListener('click', function() {
        document.querySelectorAll('.size-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        currentSize = parseInt(this.dataset.size);
    });
});

// =============================================
// ✨ ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЯ
// =============================================
async function startGeneration() {
    // Проверка конфига
    if (!checkConfig()) return;
    
    const prompt = elements.prompt.value.trim();
    if (!prompt) {
        tg.showAlert("Введите описание изображения!");
        return;
    }
    
    if (isGenerating) return;
    
    // Блокируем кнопки
    isGenerating = true;
    elements.generateBtn.disabled = true;
    
    // Показываем загрузку
    elements.placeholder.classList.add('hidden');
    elements.generatedImage.classList.add('hidden');
    elements.loadingOverlay.classList.remove('hidden');
    elements.actionButtons.classList.add('hidden');
    
    // Обновляем статус
    updateLoadingStatus("Начинаем генерацию...", "Подготовка запроса");
    
    try {
        // Добавляем стиль к промпту
        const fullPrompt = `${prompt}, ${currentStyle}, высокое качество, детализировано, 4k`;
        
        updateLoadingStatus("Отправка запроса в нейросеть...", "Это может занять несколько секунд");
        
        // Создаем задачу в Replicate
        const prediction = await createPrediction(fullPrompt);
        
        // Ждем результат
        updateLoadingStatus("Нейросеть рисует...", "Обычно это занимает 10-15 секунд");
        
        const imageUrl = await waitForPrediction(prediction.id);
        
        // Показываем результат
        elements.generatedImage.src = imageUrl;
        elements.generatedImage.classList.remove('hidden');
        elements.loadingOverlay.classList.add('hidden');
        elements.actionButtons.classList.remove('hidden');
        
        // Сохраняем в историю
        currentImageUrl = imageUrl;
        saveToHistory(prompt, imageUrl);
        
        updateApiStatus("✅ Готово!");
        
    } catch (error) {
        console.error("Generation error:", error);
        
        elements.loadingOverlay.classList.add('hidden');
        elements.placeholder.classList.remove('hidden');
        
        tg.showAlert("Ошибка генерации: " + error.message);
        updateApiStatus("❌ Ошибка: " + error.message);
        
    } finally {
        isGenerating = false;
        elements.generateBtn.disabled = false;
    }
}

// =============================================
// 📡 РАБОТА С REPLICATE API
// =============================================

// Создание задачи
async function createPrediction(prompt) {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${CONFIG.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version: CONFIG.MODEL_VERSION,
            input: {
                prompt: prompt,
                width: currentSize,
                height: currentSize,
                num_outputs: 1,
                num_inference_steps: 25,
                guidance_scale: 7.5
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${error}`);
    }
    
    return await response.json();
}

// Ожидание результата
async function waitForPrediction(predictionId) {
    let attempts = 0;
    const maxAttempts = 60; // 60 секунд максимум
    
    while (attempts < maxAttempts) {
        await sleep(2000); // Ждем 2 секунды
        
        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                "Authorization": `Token ${CONFIG.REPLICATE_API_TOKEN}`
            }
        });
        
        const prediction = await response.json();
        
        if (prediction.status === "succeeded") {
            return prediction.output[0];
        }
        
        if (prediction.status === "failed") {
            throw new Error("Генерация не удалась");
        }
        
        attempts++;
    }
    
    throw new Error("Превышено время ожидания");
}

// =============================================
// 📤 ОТПРАВКА В TELEGRAM
// =============================================
async function sendToTelegram() {
    if (!currentImageUrl) {
        tg.showAlert("Сначала сгенерируйте изображение!");
        return;
    }
    
    elements.sendBtn.disabled = true;
    updateApiStatus("📤 Отправка в Telegram...");
    
    try {
        // Получаем информацию о пользователе
        const user = tg.initDataUnsafe?.user;
        
        // Отправляем данные в бот
        tg.sendData(JSON.stringify({
            type: "generated_image",
            image_url: currentImageUrl,
            prompt: elements.prompt.value,
            style: currentStyle,
            user_id: user?.id,
            username: user?.username
        }));
        
        updateApiStatus("✅ Отправлено!");
        
        // Показываем сообщение об успехе
        tg.showAlert("✅ Изображение отправлено в чат!");
        
        // Закрываем мини-апп (опционально)
        setTimeout(() => tg.close(), 1000);
        
    } catch (error) {
        console.error("Send error:", error);
        tg.showAlert("Ошибка отправки");
        elements.sendBtn.disabled = false;
    }
}

// =============================================
// 💾 ИСТОРИЯ
// =============================================

// Сохранить в историю
function saveToHistory(prompt, imageUrl) {
    const item = {
        id: Date.now(),
        prompt: prompt,
        imageUrl: imageUrl,
        style: currentStyle,
        timestamp: new Date().toISOString()
    };
    
    history.unshift(item);
    
    // Оставляем только последние 12
    if (history.length > 12) {
        history = history.slice(0, 12);
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('generation_history', JSON.stringify(history));
    
    // Обновляем отображение
    renderHistory();
}

// Загрузить историю
function loadHistory() {
    const saved = localStorage.getItem('generation_history');
    if (saved) {
        try {
            history = JSON.parse(saved);
            renderHistory();
        } catch (e) {
            console.error("Error loading history:", e);
        }
    }
}

// Отобразить историю
function renderHistory() {
    if (!elements.historyGrid) return;
    
    if (history.length === 0) {
        elements.historyGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--tg-theme-hint-color);">Пока нет истории</p>';
        return;
    }
    
    elements.historyGrid.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadFromHistory('${item.imageUrl}', '${item.prompt.replace(/'/g, "\\'")}')">
            <img src="${item.imageUrl}" alt="${item.prompt}" loading="lazy">
        </div>
    `).join('');
}

// Загрузить из истории
function loadFromHistory(imageUrl, prompt) {
    currentImageUrl = imageUrl;
    elements.prompt.value = prompt;
    elements.generatedImage.src = imageUrl;
    elements.generatedImage.classList.remove('hidden');
    elements.placeholder.classList.add('hidden');
    elements.actionButtons.classList.remove('hidden');
}

// =============================================
// 🛠 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =============================================

// Сброс генератора
function resetGenerator() {
    currentImageUrl = null;
    elements.generatedImage.classList.add('hidden');
    elements.placeholder.classList.remove('hidden');
    elements.actionButtons.classList.add('hidden');
    elements.prompt.value = '';
}

// Обновление статуса загрузки
function updateLoadingStatus(text, subtext) {
    elements.loadingText.textContent = text;
    elements.loadingSubtext.textContent = subtext;
}

// Обновление статуса API
function updateApiStatus(text) {
    elements.apiStatus.textContent = `🔑 ${text}`;
}

// Показать уведомление
function showNotification(text, duration = 3000) {
    const oldStatus = elements.apiStatus.textContent;
    elements.apiStatus.textContent = `⚠️ ${text}`;
    setTimeout(() => {
        elements.apiStatus.textContent = oldStatus;
    }, duration);
}

// Сон
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================
// 🚀 ЗАПУСК
// =============================================

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Применяем тему Telegram
    document.body.style.backgroundColor = tg.themeParams.bg_color;
    
    // Проверяем конфиг
    if (!checkConfig()) {
        elements.generateBtn.disabled = true;
    }
    
    // Обновляем статус
    updateApiStatus("✅ Готов к работе!");
    
    // Выбираем стиль по умолчанию
    document.querySelector(`[data-style="${CONFIG.DEFAULT_STYLE}"]`)?.classList.add('selected');
});

// Обработка смены темы
tg.onEvent('themeChanged', () => {
    document.body.style.backgroundColor = tg.themeParams.bg_color;
});
