// api/generate-images.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCanvas, loadImage, CanvasRenderingContext2D, CanvasTextAlign, CanvasTextBaseline, registerFont } from 'canvas';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';


// --- Type Definitions ---
interface AnimalData {
  lobo: number;
  aguia: number;
  tubarao: number;
  gato: number;
}

interface BrainData {
  pensante: number;
  atuante: number;
  razao: number;
  emocao: number;
}

// --- Image Processing Logic ---

const drawTextWithShadow = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  fillStyle: string,
  textAlign: CanvasTextAlign,
  textBaseline: CanvasTextBaseline
) => {
  ctx.font = font;
  ctx.fillStyle = fillStyle;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillText(text, x, y);

  // Reset shadow for next drawing
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};

const generateAnimalImage = async (baseImageBuffer: Buffer, data: AnimalData): Promise<string> => {
    try {
        const img = await loadImage(baseImageBuffer);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        const animalEntries = Object.entries(data) as [keyof AnimalData, number][];

        let highestAnimalName: keyof AnimalData | null = null;
        let maxPercentage = -1;

        // Find the animal with the highest percentage
        for (const [name, percentage] of animalEntries) {
            if (percentage > maxPercentage) {
                maxPercentage = percentage;
                highestAnimalName = name;
            }
        }

        const fontName = '"Arial Bold"'; // Use the registered font
        const normalFontSize = 36;
        const highestFontSize = 40;
        const normalColor = '#FFFFFF'; // White
        const highestColor = '#FFFF00'; // Yellow

        const positions: { [key in keyof AnimalData]: { x: number; y: number } } = {
          lobo:    { x: 85, y: 280 },
          aguia:   { x: 380, y: 280 },
          tubarao: { x: 85, y: 635 },
          gato:    { x: 380, y: 635 },
        };

        for (const [name, percentage] of animalEntries) {
          const isHighest = name === highestAnimalName;
          const fontSize = isHighest ? highestFontSize : normalFontSize;
          const color = isHighest ? highestColor : normalColor;
          const font = `${fontSize}px ${fontName}`;
          const text = `${percentage}%`;
          const { x, y } = positions[name];

          // Center the text at the given coordinates
          drawTextWithShadow(ctx, text, x, y, font, color, 'center', 'middle');
        }

        return canvas.toDataURL('image/png');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Error during animal image processing: ${errorMessage}`);
    }
};

const generateBrainImage = async (baseImageBuffer: Buffer, data: BrainData): Promise<string> => {
    try {
        const img = await loadImage(baseImageBuffer);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
  
        ctx.drawImage(img, 0, 0);
        
        const brainEntries = Object.entries(data) as [keyof BrainData, number][];

        let highestBrainName: keyof BrainData | null = null;
        let maxPercentage = -1;

        // Find the brain characteristic with the highest percentage
        for (const [name, percentage] of brainEntries) {
            if (percentage > maxPercentage) {
                maxPercentage = percentage;
                highestBrainName = name;
            }
        }
        
        const fontName = '"Arial Bold"'; // Use the registered font
        const normalFontSize = 36;
        const highestFontSize = 40;
        const normalColor = '#FFFFFF'; // White
        const highestColor = '#FFFF00'; // Yellow

        const positions: { [key in keyof BrainData]: { x: number; y: number } } = {
            razao:    { x: 93, y: 450 },
            emocao:   { x: 540, y: 450 },
            pensante: { x: 315, y: 215 },
            atuante:  { x: 315, y: 780 },
        };
  
        for (const [name, percentage] of brainEntries) {
            const isHighest = name === highestBrainName;
            const fontSize = isHighest ? highestFontSize : normalFontSize;
            const color = isHighest ? highestColor : normalColor;
            const font = `${fontSize}px ${fontName}`;
            const text = `${percentage}%`;
            const { x, y } = positions[name];

            // Center the text at the given coordinates
            drawTextWithShadow(ctx, text, x, y, font, color, 'center', 'middle');
        }
  
        return canvas.toDataURL('image/png');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Error during brain image processing: ${errorMessage}`);
    }
};

// --- Resource URLs ---
const FONT_URL = 'https://drive.google.com/uc?export=download&id=1Djbg9Gj1-PUL7qFvMMjqRuljvXYzNmeD';
const BASE_IMAGE_BRAIN_URL = 'https://i.postimg.cc/LXMYjwtX/Inserir-um-t-tulo-6.png';
const BASE_IMAGE_ANIMALS_URL = 'https://i.postimg.cc/6QDYdjPb/Design-sem-nome-17.png';


// --- Vercel Serverless Function Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Define a temporary path for the font file in a writable directory.
  const tempFontPath = path.join('/tmp', 'Arial_Bold.ttf');

  try {
    const { animalData, brainData } = req.body;

    if (!animalData || !brainData) {
      return res.status(400).json({ error: 'Request body must contain "animalData" and "brainData" objects.' });
    }
    
    // Step 1: Download all resources (font and images) in parallel.
    const [fontResponse, animalImgResponse, brainImgResponse] = await Promise.all([
      fetch(FONT_URL),
      fetch(BASE_IMAGE_ANIMALS_URL),
      fetch(BASE_IMAGE_BRAIN_URL)
    ]);

    // Check if all downloads were successful.
    if (!fontResponse.ok || !animalImgResponse.ok || !brainImgResponse.ok) {
       throw new Error(`Failed to download resources. Font: ${fontResponse.status}, Animals: ${animalImgResponse.status}, Brain: ${brainImgResponse.status}`);
    }

    // Convert responses to buffers.
    const [fontBuffer, animalImgBuffer, brainImgBuffer] = await Promise.all([
        fontResponse.arrayBuffer().then(ab => Buffer.from(ab)),
        animalImgResponse.arrayBuffer().then(ab => Buffer.from(ab)),
        brainImgResponse.arrayBuffer().then(ab => Buffer.from(ab))
    ]);

    // Step 2: Save the font buffer to a temporary file.
    // This is necessary because node-canvas's registerFont requires a file path.
    fs.writeFileSync(tempFontPath, fontBuffer);
    
    // Step 3: Register the font using the temporary file path.
    registerFont(tempFontPath, { family: 'Arial Bold' });
    
    // Step 4: Generate images using the downloaded buffers.
    const [animalImage, brainImage] = await Promise.all([
      generateAnimalImage(animalImgBuffer, animalData),
      generateBrainImage(brainImgBuffer, brainData),
    ]);

    res.status(200).json({
      animalImage,
      brainImage,
    });
  } catch (error) {
    console.error('Image generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: 'Failed to generate images.', details: errorMessage });
  } finally {
    // Step 5 (Cleanup): Remove the temporary font file to free up space.
    try {
        if (fs.existsSync(tempFontPath)) {
            fs.unlinkSync(tempFontPath);
        }
    } catch (cleanupError) {
        console.error('Failed to cleanup temporary font file:', cleanupError);
    }
  }
}
