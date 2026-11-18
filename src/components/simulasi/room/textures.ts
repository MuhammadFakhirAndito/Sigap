import * as THREE from "three";
import { createSeededRandom } from "@/lib/simulasi-visual";

/**
 * Tekstur prosedural kecil (canvas 2D), dibuat sekali per mount lalu di-dispose.
 * Sengaja kecil (<= 512 px) agar ringan di ponsel; tidak ada berkas gambar eksternal.
 */

function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  color = true
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Lantai papan kayu terang: papan horizontal dengan sambungan berselang dan serat halus. */
export function woodFloorTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const rand = createSeededRandom(4021);
    const rows = 9;
    const rowH = h / rows;
    const tones = ["#CFA77C", "#C79F73", "#D4AE84", "#C29A6E", "#CBA378"];
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const offset = (r % 2) * (w * 0.37) + rand() * 60;
      for (let x = -offset; x < w; x += w * 0.62) {
        ctx.fillStyle = tones[Math.floor(rand() * tones.length)]!;
        ctx.fillRect(x, y, w * 0.62, rowH);
        ctx.strokeStyle = "rgba(92, 62, 36, 0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
      for (let g = 0; g < 4; g++) {
        ctx.strokeStyle = `rgba(120, 82, 48, ${0.06 + rand() * 0.06})`;
        ctx.lineWidth = 1;
        const gy = y + rowH * (0.2 + rand() * 0.6);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(w * 0.3, gy + 3, w * 0.6, gy - 3, w, gy + 1);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(92, 62, 36, 0.4)";
      ctx.fillRect(0, y, w, 2);
    }
  });
}

/** Karpet berpinggir dengan pola garis lembut. */
export function rugTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 192, (ctx, w, h) => {
    ctx.fillStyle = "#E3D3BD";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#B97E5E";
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.strokeStyle = "#D2B79A";
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, w - 52, h - 52);
    ctx.fillStyle = "rgba(185, 126, 94, 0.18)";
    for (let x = 40; x < w - 40; x += 16) {
      ctx.fillRect(x, 40, 6, h - 80);
    }
  });
}

/** Retakan bercabang di atas latar transparan; deterministik per seed. */
export function crackTexture(seed: number): THREE.CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const rand = createSeededRandom(seed);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const branch = (x: number, y: number, angle: number, length: number, width: number, depth: number) => {
      let cx = x;
      let cy = y;
      const steps = Math.max(3, Math.round(length / 14));
      ctx.lineWidth = width;
      ctx.strokeStyle = "rgba(70, 54, 40, 0.85)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let i = 0; i < steps; i++) {
        angle += (rand() - 0.5) * 0.9;
        cx += Math.cos(angle) * (length / steps);
        cy += Math.sin(angle) * (length / steps);
        ctx.lineTo(cx, cy);
        if (depth > 0 && rand() < 0.22) {
          ctx.stroke();
          branch(cx, cy, angle + (rand() > 0.5 ? 0.8 : -0.8), length * 0.45, width * 0.6, depth - 1);
          ctx.lineWidth = width;
          ctx.strokeStyle = "rgba(70, 54, 40, 0.85)";
          ctx.beginPath();
          ctx.moveTo(cx, cy);
        }
      }
      ctx.stroke();
    };

    branch(w * 0.15, h * 0.08, Math.PI * 0.42, h * 0.75, 3.2, 2);
    branch(w * 0.7, h * 0.2, Math.PI * 0.62, h * 0.5, 2.4, 2);
  });
}

/** Gradien hitam -> transparan untuk "ambient occlusion" palsu di sudut dan tepi dinding. */
export function edgeShadeTexture(direction: "up" | "left" | "right"): THREE.CanvasTexture {
  return canvasTexture(
    direction === "up" ? 8 : 128,
    direction === "up" ? 128 : 8,
    (ctx, w, h) => {
      const grad =
        direction === "up"
          ? ctx.createLinearGradient(0, 0, 0, h)
          : direction === "left"
            ? ctx.createLinearGradient(0, 0, w, 0)
            : ctx.createLinearGradient(w, 0, 0, 0);
      grad.addColorStop(0, "rgba(40, 28, 18, 0.42)");
      grad.addColorStop(1, "rgba(40, 28, 18, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    false
  );
}

/** Bayangan kontak lembut di bawah diorama. */
export function contactShadowTexture(): THREE.CanvasTexture {
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w * 0.5);
      grad.addColorStop(0, "rgba(40, 30, 22, 0.5)");
      grad.addColorStop(1, "rgba(40, 30, 22, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    false
  );
}

/** Berkas cahaya jendela: terang di atas, memudar ke bawah. */
export function lightBeamTexture(): THREE.CanvasTexture {
  return canvasTexture(
    8,
    128,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(255, 236, 200, 0.9)");
      grad.addColorStop(1, "rgba(255, 236, 200, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    false
  );
}

/** Lukisan pemandangan sederhana untuk bingkai foto. */
export function pictureTexture(): THREE.CanvasTexture {
  return canvasTexture(192, 256, (ctx, w, h) => {
    ctx.fillStyle = "#F2D9B8";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#E9A86F";
    ctx.beginPath();
    ctx.arc(w * 0.68, h * 0.3, w * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8FA67A";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.quadraticCurveTo(w * 0.35, h * 0.42, w * 0.7, h * 0.6);
    ctx.quadraticCurveTo(w * 0.85, h * 0.66, w, h * 0.58);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = "#5F7F4E";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    ctx.quadraticCurveTo(w * 0.5, h * 0.66, w, h * 0.8);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
  });
}

/** Muka jam dinding dengan penanda jam dan jarum. */
export function clockFaceTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = "#FBF6EE";
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3A2E25";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.lineWidth = i % 3 === 0 ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * c * 0.72, c + Math.sin(a) * c * 0.72);
      ctx.lineTo(c + Math.cos(a) * c * 0.86, c + Math.sin(a) * c * 0.86);
      ctx.stroke();
    }
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + c * 0.38, c - c * 0.18);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c - c * 0.1, c - c * 0.62);
    ctx.stroke();
    ctx.fillStyle = "#3A2E25";
    ctx.beginPath();
    ctx.arc(c, c, 10, 0, Math.PI * 2);
    ctx.fill();
  });
}
