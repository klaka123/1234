// ВСТАВЬ ЭТО В САМОЕ НАЧАЛО app.js

// Обходим CORS и блокировки
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
const REPLICATE_API = 'https://api.replicate.com';

// Переопределяем fetch для работы через прокси
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (url.includes('replicate.com')) {
        url = PROXY_URL + url;
    }
    return originalFetch(url, options);
};

console.log('Прокси для Replicate включен!');
