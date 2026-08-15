import type { CanvasState } from '@shared/types';
import { EXPORT_FORMATS } from '@shared/constants';

export async function exportCanvas(
  canvas: any,
  format: 'png' | 'jpeg' | 'svg' | 'pdf',
  dpi: number = 1
): Promise<string | Blob> {
  if (!canvas) throw new Error('Canvas is not initialized');

  const width = canvas.getWidth();
  const height = canvas.getHeight();

  switch (format) {
    case 'png': {
      const scale = dpi;
      return new Promise<string>((resolve) => {
        canvas.setDimensions({
          width: width * scale,
          height: height * scale,
        });
        canvas.setZoom(scale);
        const dataURL = canvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1,
        });
        canvas.setDimensions({ width, height });
        canvas.setZoom(1);
        resolve(dataURL);
      });
    }

    case 'jpeg': {
      return canvas.toDataURL({
        format: 'jpeg',
        quality: 0.95,
        multiplier: dpi,
      });
    }

    case 'svg': {
      return canvas.toSVG();
    }

    case 'pdf': {
      const svg = canvas.toSVG();
      return new Blob([svg], { type: 'image/svg+xml' });
    }

    default:
      throw new Error('Unsupported export format');
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
