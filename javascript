// Точное определение ячейки после падения
function getFinalMultiplier(ballX) {
    const cellWidth = 40; // ширина ячейки
    const startX = 190 - (rows * 20); // левая граница первой ячейки
    const col = Math.floor((ballX - startX) / cellWidth);
    const clampedCol = Math.max(0, Math.min(8, col));
    return plinkoMultipliers[clampedCol];
}
// Ракета смотрит вверх (поворот через canvas)
ctx.save();
ctx.translate(x, y);
ctx.rotate(-Math.PI/2); // поворот на 90° против часовой
ctx.drawImage(rocketImage, -25, -40, 50, 80);
ctx.restore();
