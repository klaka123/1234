const TG = window.Telegram.WebApp;
const userId = TG.initDataUnsafe?.user?.id || 'guest';
const storageKey = `casino_${userId}`;

let data = JSON.parse(localStorage.getItem(storageKey)) || {
    balance: 10000,
    referrals: 0,
    usedPromos: [],
    games: {}
};

function saveData() {
    localStorage.setItem(storageKey, JSON.stringify(data));
}
