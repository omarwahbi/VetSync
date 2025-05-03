import fs from 'fs';
import { createCanvas } from 'canvas';

// Directory where public files are stored
const PUBLIC_DIR = './public';

// Create the canvas for the favicon
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Draw the background
ctx.fillStyle = '#F3F4F6';
ctx.beginPath();
ctx.roundRect(0, 0, 32, 32, 6);
ctx.fill();

// Draw the "V"
ctx.fillStyle = '#3B82F6';
ctx.font = 'bold 20px Arial';
ctx.fillText('V', 4, 22);

// Draw the "S"
ctx.fillStyle = '#10B981';
ctx.font = 'bold 20px Arial';
ctx.fillText('S', 16, 22);

// Draw the vertical line
ctx.strokeStyle = '#10B981';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.moveTo(15, 7);
ctx.lineTo(15, 25);
ctx.stroke();

// Draw the wave
ctx.beginPath();
ctx.moveTo(10, 16);
ctx.bezierCurveTo(12, 14, 13, 14, 15, 16);
ctx.bezierCurveTo(17, 18, 18, 18, 20, 16);
ctx.stroke();

// Convert canvas to PNG
const pngData = canvas.toBuffer('image/png');
fs.writeFileSync(`${PUBLIC_DIR}/favicon.png`, pngData);

console.log('Favicon PNG created successfully!');
console.log('Now manually convert favicon.png to favicon.ico using an online converter.'); 