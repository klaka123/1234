// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Состояние приложения
let isGenerating = false;
let currentImageUrl = null;
let pipeline = null;

// Элементы DOM
const promptInput = document.getElementById('prompt');
const negativeInput = document.getElementById('negative');
const styleSelect = document.getElementById('style');
const qualitySelect = document.getElementById('quality');
const generateBtn = document.getElementById('generateBtn');
const sendBtn = document.getElementById('sendBtn');
const loadingDiv = document.getElementById('loading');
const imageContainer = document.getElementById('imageContainer');
const placeholderDiv = document.getElementById('placeholder');
const generatedImage = document.getElementById('generatedImage');
const statusDiv = document.getElementById('status');
const progressSpan = document.getElementById('progress');

// Инициализация нейросети
async function initModel() {
    try {
        statusDiv.textContent = '⏳ Загрузка модели Stable Diffusion... Это 50-100 МБ';
        
        // Используем готовую модель для генерации
        pipeline = await transformers.pipeline(
            'text-to-image',
            'Xenova/stable-diffusion-v1-4',
            {
                quantized: true,
                progress_callback: (progress) => {
                    if (progress.status === 'downloading') {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        progressSpan.textContent = `${percent}%`;
                        statusDiv.textContent = `📥 Загрузка: ${percent}%`;
                    }
                }
            }
        );
        
        statusDiv.textContent = '✅ Нейросеть готова! Можно генерировать';
        generateBtn.disabled = false;
        
    } catch (error) {
        console.error('Ошибка загрузки модели:', error);
        statusDiv.textContent = '❌ Ошибка загрузки. Использую альтернативный метод';
        useAlternativeGenerator();
    }
}

// Альтернативный генератор (если не загрузилась основная модель)
function useAlternativeGenerator() {
    statusDiv.textContent = '🎨 Использую встроенный генератор';
    generateBtn.disabled = false;
}

// Основная функция генерации
async function generateImage() {
    if (isGenerating) return;
    
    const prompt = promptInput.value.trim();
    if (!prompt) {
        tg.showAlert('Введите описание картинки!');
        return;
    }
    
    // Добавляем стиль к промпту
    const style = styleSelect.value;
    const fullPrompt = `${prompt}, ${style}, высокое качество, детализировано, 8k`;
    const negativePrompt = negativeInput.value;
    
    isGenerating = true;
    generateBtn.disabled = true;
    sendBtn.disabled = true;
    
    // Показываем загрузку
    loadingDiv.classList.remove('hidden');
    placeholderDiv.classList.add('hidden');
    imageContainer.classList.add('hidden');
    
    try {
        let imageUrl;
        
        if (pipeline) {
            // Используем реальную нейросеть
            statusDiv.textContent = '🧠 Нейросеть думает...';
            
            // Генерируем изображение
            const result = await pipeline(fullPrompt, {
                negative_prompt: negativePrompt,
                num_inference_steps: 20,
                guidance_scale: 7.5,
                width: parseInt(qualitySelect.value),
                height: parseInt(qualitySelect.value),
                progress_callback: (progress) => {
                    const step = Math.round((progress.step / progress.total_steps) * 100);
                    progressSpan.textContent = `${step}%`;
                }
            });
            
            // Конвертируем в URL
            imageUrl = URL.createObjectURL(result);
            
        } else {
            // Альтернативная генерация через API
            statusDiv.textContent = '🎨 Генерирую через облако...';
            imageUrl = await generateWithHuggingFace(fullPrompt, negativePrompt);
        }
        
        // Показываем результат
        currentImageUrl = imageUrl;
        generatedImage.src = imageUrl;
        
        loadingDiv.classList.add('hidden');
        imageContainer.classList.remove('hidden');
        sendBtn.disabled = false;
        
        statusDiv.textContent = '✅ Готово!';
        
    } catch (error) {
        console.error('Ошибка генерации:', error);
        loadingDiv.classList.add('hidden');
        placeholderDiv.classList.remove('hidden');
        
        tg.showAlert('Ошибка генерации. Попробуйте еще раз.');
        statusDiv.textContent = '❌ Ошибка';
        
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
    }
}

// Альтернативный метод через Hugging Face API
async function generateWithHuggingFace(prompt, negativePrompt) {
    // Используем публичный API (с ограничениями)
    const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                negative_prompt: negativePrompt,
                width: parseInt(qualitySelect.value),
                height: parseInt(qualitySelect.value)
            }
        })
    });
    
    if (!response.ok) {
        throw new Error('API Error');
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// Отправка в Telegram
function sendToTelegram() {
    if (!currentImageUrl) return;
    
    tg.sendData(JSON.stringify({
        type: 'image',
        url: currentImageUrl,
        prompt: promptInput.value
    }));
    
    tg.close();
}

// Использовать пример
function useExample(text) {
    promptInput.value = text;
    promptInput.focus();
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Настраиваем тему Telegram
    document.body.style.backgroundColor = tg.themeParams.bg_color;
    
    // Загружаем модель
    initModel();
});

// Обработка темы Telegram
tg.onEvent('themeChanged', () => {
    document.body.style.backgroundColor = tg.themeParams.bg_color;
});
