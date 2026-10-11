/**
 * Preprocessor Utility for Sketch & Handwritten Digit Recognition
 * Performs:
 * 1. Empty canvas detection
 * 2. Bounding box detection of drawn strokes
 * 3. Aspect-ratio preserving scaling into a 20x20 area within 28x28
 * 4. Center-of-mass centering (standard MNIST / QuickDraw preprocessing)
 * 5. Grayscale conversion & [0, 1] normalization
 * 6. Generates a 28x28 preview thumbnail for real-time visualization
 */

export function preprocessCanvas(canvas, isDarkBackground = true) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const width = canvas.width;
  const height = canvas.height;
  
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Find bounding box of drawing
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasInk = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Determine brightness/ink
      let brightness;
      if (isDarkBackground) {
        // Black background, white ink: alpha or rgb brightness indicates ink
        brightness = Math.max(r, g, b) * (a / 255);
      } else {
        // White background, black ink
        brightness = (255 - (r * 0.299 + g * 0.587 + b * 0.114)) * (a / 255);
      }

      if (brightness > 20) { // Threshold for stroke ink
        hasInk = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasInk || minX > maxX || minY > maxY) {
    return {
      isEmpty: true,
      tensorData: null,
      previewUrl: null
    };
  }

  // Add slight padding around bounding box
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;

  // 2. Create offscreen canvas for scaling and centering
  const offscreen = document.createElement('canvas');
  offscreen.width = 28;
  offscreen.height = 28;
  const offCtx = offscreen.getContext('2d');

  // Fill offscreen background with pure black
  offCtx.fillStyle = '#000000';
  offCtx.fillRect(0, 0, 28, 28);

  // Scale bounding box so max dimension fits in 20 pixels
  const maxDim = Math.max(boxWidth, boxHeight);
  const scale = 20.0 / maxDim;
  const scaledW = Math.round(boxWidth * scale);
  const scaledH = Math.round(boxHeight * scale);

  // Create intermediate canvas for the cropped bounding box
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = boxWidth;
  cropCanvas.height = boxHeight;
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.drawImage(canvas, minX, minY, boxWidth, boxHeight, 0, 0, boxWidth, boxHeight);

  // Position centered in 28x28 (leaving ~4px border)
  const destX = Math.round((28 - scaledW) / 2);
  const destY = Math.round((28 - scaledH) / 2);

  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = 'high';
  offCtx.drawImage(cropCanvas, 0, 0, boxWidth, boxHeight, destX, destY, scaledW, scaledH);

  // 3. Extract 28x28 grayscale normalized tensor data [0, 1]
  const procData = offCtx.getImageData(0, 0, 28, 28).data;
  const floatArray = new Float32Array(28 * 28);

  for (let i = 0; i < 28 * 28; i++) {
    const r = procData[i * 4];
    const g = procData[i * 4 + 1];
    const b = procData[i * 4 + 2];
    const a = procData[i * 4 + 3];

    let val;
    if (isDarkBackground) {
      val = Math.max(r, g, b) * (a / 255.0);
    } else {
      val = (255 - (r * 0.299 + g * 0.587 + b * 0.114)) * (a / 255.0);
    }

    // Normalize to [0.0, 1.0]
    floatArray[i] = Math.min(1.0, Math.max(0.0, val / 255.0));
  }

  // 4. Center-of-mass shift for standard MNIST alignment
  let totalMass = 0;
  let cx = 0;
  let cy = 0;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const mass = floatArray[y * 28 + x];
      totalMass += mass;
      cx += x * mass;
      cy += y * mass;
    }
  }

  if (totalMass > 0) {
    cx /= totalMass;
    cy /= totalMass;
    const shiftX = Math.round(14 - cx);
    const shiftY = Math.round(14 - cy);

    // Apply shift if reasonable
    if (Math.abs(shiftX) <= 4 && Math.abs(shiftY) <= 4 && (shiftX !== 0 || shiftY !== 0)) {
      const shifted = new Float32Array(28 * 28);
      for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
          const oldY = y - shiftY;
          const oldX = x - shiftX;
          if (oldY >= 0 && oldY < 28 && oldX >= 0 && oldX < 28) {
            shifted[y * 28 + x] = floatArray[oldY * 28 + oldX];
          }
        }
      }
      for (let i = 0; i < 28 * 28; i++) {
        floatArray[i] = shifted[i];
      }
    }
  }

  // 5. Generate high-contrast preview canvas URL
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 28;
  previewCanvas.height = 28;
  const pCtx = previewCanvas.getContext('2d');
  const pImgData = pCtx.createImageData(28, 28);
  for (let i = 0; i < 28 * 28; i++) {
    const pixelVal = Math.round(floatArray[i] * 255);
    pImgData.data[i * 4] = pixelVal;
    pImgData.data[i * 4 + 1] = pixelVal;
    pImgData.data[i * 4 + 2] = pixelVal;
    pImgData.data[i * 4 + 3] = 255;
  }
  pCtx.putImageData(pImgData, 0, 0);
  const previewUrl = previewCanvas.toDataURL('image/png');

  return {
    isEmpty: false,
    tensorData: floatArray,
    previewUrl,
    box: { minX, minY, boxWidth, boxHeight }
  };
}
