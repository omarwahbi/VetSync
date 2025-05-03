import fs from 'fs';
import { createCanvas } from 'canvas';

// Directory where public files are stored
const PUBLIC_DIR = './public';

// Create the canvas for the apple touch icon
const canvas = createCanvas(180, 180);
const ctx = canvas.getContext('2d');

// Draw the background
ctx.fillStyle = '#F3F4F6';
ctx.beginPath();
ctx.roundRect(0, 0, 180, 180, 45);
ctx.fill();

// Draw the "V"
ctx.fillStyle = '#3B82F6';
ctx.font = 'bold 110px Arial';
ctx.fillText('V', 26, 118);

// Draw the "S"
ctx.fillStyle = '#10B981';
ctx.font = 'bold 110px Arial';
ctx.fillText('S', 90, 118);

// Draw the vertical line
ctx.strokeStyle = '#10B981';
ctx.lineWidth = 6;
ctx.beginPath();
ctx.moveTo(85, 35);
ctx.lineTo(85, 145);
ctx.stroke();

// Draw the wave
ctx.beginPath();
ctx.moveTo(55, 90);
ctx.bezierCurveTo(65, 75, 75, 75, 85, 90);
ctx.bezierCurveTo(95, 105, 105, 105, 115, 90);
ctx.stroke();

// Convert canvas to PNG
const pngData = canvas.toBuffer('image/png');
fs.writeFileSync(`${PUBLIC_DIR}/apple-touch-icon.png`, pngData);

console.log('Apple touch icon PNG created successfully!'); 