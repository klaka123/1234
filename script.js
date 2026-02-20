// Получи ключ на replicate.com
const API_TOKEN = 'твой_ключ_здесь';

async function generateWithReplicate(prompt) {
    // Создаем задачу
    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input: { prompt: prompt }
        })
    });
    
    const prediction = await response.json();
    
    // Ждем результат
    while (prediction.status !== 'succeeded') {
        await new Promise(r => setTimeout(r, 1000));
        const getResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { 'Authorization': `Token ${API_TOKEN}` }
        });
        prediction = await getResponse.json();
    }
    
    return prediction.output[0];
}
