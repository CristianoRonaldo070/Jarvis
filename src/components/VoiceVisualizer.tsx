import { useEffect, useRef } from "react";

type JarvisState = "idle" | "listening" | "processing" | "speaking" | "error";

const VoiceVisualizer = ({ state }: { state: JarvisState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = (canvas.width = 400);
    const h = (canvas.height = 400);
    let time = 0;

    const getColors = () => {
      switch (state) {
        case "listening":
          return { h: 190, s: 100, l: 50, label: "cyan" };
        case "processing":
          return { h: 45, s: 100, l: 55, label: "gold" };
        case "speaking":
          return { h: 150, s: 80, l: 50, label: "emerald" };
        case "error":
          return { h: 0, s: 80, l: 55, label: "red" };
        default:
          return { h: 190, s: 100, l: 50, label: "cyan" };
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2,
        cy = h / 2;
      const { h: hue, s, l } = getColors();
      const active = state === "listening" || state === "speaking";
      const processing = state === "processing";

      // Outer glow circle
      const gradient = ctx.createRadialGradient(cx, cy, 60, cx, cy, 180);
      gradient.addColorStop(
        0,
        active || processing
          ? `hsla(${hue}, ${s}%, ${l}%, 0.15)`
          : `hsla(${hue}, ${s}%, ${l}%, 0.05)`
      );
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Draw wave circles
      const numCircles = active || processing ? 5 : 3;
      for (let c = 0; c < numCircles; c++) {
        const baseRadius = 60 + c * 25;
        ctx.beginPath();
        for (let a = 0; a <= 360; a += 2) {
          const rad = (a * Math.PI) / 180;
          let noise: number;
          if (state === "listening") {
            noise =
              Math.sin(time * 3 + a * 0.05 + c) *
              (15 + c * 5) *
              Math.sin(time * 2 + c * 0.7);
          } else if (state === "speaking") {
            noise =
              Math.sin(time * 4 + a * 0.04 + c) *
              (12 + c * 4) *
              Math.cos(time * 2.5 + c * 0.5);
          } else if (state === "processing") {
            noise = Math.sin(time * 6 + a * 0.08 + c * 2) * (8 + c * 3);
          } else if (state === "error") {
            noise = Math.sin(time * 8 + a * 0.1) * 5 * Math.random();
          } else {
            noise = Math.sin(time + a * 0.03 + c) * 3;
          }
          const r = baseRadius + noise;
          const x = cx + Math.cos(rad) * r;
          const y = cy + Math.sin(rad) * r;
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        const alpha =
          active || processing ? 0.6 - c * 0.08 : 0.2 - c * 0.04;
        ctx.strokeStyle = `hsla(${hue}, ${s}%, ${l + c * 5}%, ${Math.max(
          alpha,
          0.05
        )})`;
        ctx.lineWidth = active || processing ? 2 : 1;
        ctx.stroke();
      }

      // Center core
      const coreSize =
        active || processing
          ? 20 + Math.sin(time * 4) * 8
          : 15 + Math.sin(time) * 2;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
      coreGrad.addColorStop(
        0,
        active || processing
          ? `hsla(${hue}, ${s}%, ${l + 20}%, 0.9)`
          : `hsla(${hue}, ${s}%, ${l}%, 0.4)`
      );
      coreGrad.addColorStop(1, "transparent");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fill();

      // Waveform bars
      if (active || processing) {
        const barCount = 32;
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          let barH: number;
          if (state === "listening") {
            barH =
              20 +
              Math.sin(time * 5 + i * 0.5) * 25 +
              Math.cos(time * 3 + i * 0.3) * 15;
          } else if (state === "speaking") {
            barH =
              15 +
              Math.sin(time * 4 + i * 0.6) * 20 +
              Math.cos(time * 2.5 + i * 0.4) * 12;
          } else {
            // processing — spinning bars
            barH =
              10 +
              Math.sin(time * 8 + i * 0.4) * 15 +
              Math.cos(time * 5 + i * 0.2) * 10;
          }
          const x1 = cx + Math.cos(angle) * 100;
          const y1 = cy + Math.sin(angle) * 100;
          const x2 = cx + Math.cos(angle) * (100 + barH);
          const y2 = cy + Math.sin(angle) * (100 + barH);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsla(${hue}, ${s}%, ${l + 10}%, ${
            0.4 + Math.sin(time * 3 + i) * 0.3
          })`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Error — glitchy red flickers
      if (state === "error") {
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const len = 40 + Math.random() * 60;
          const x1 = cx + Math.cos(angle) * 80;
          const y1 = cy + Math.sin(angle) * 80;
          const x2 = cx + Math.cos(angle) * (80 + len);
          const y2 = cy + Math.sin(angle) * (80 + len);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsla(0, 80%, 55%, ${0.3 + Math.random() * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Processing — spinning ring
      if (processing) {
        ctx.beginPath();
        ctx.arc(cx, cy, 105, time * 2, time * 2 + Math.PI * 1.2);
        ctx.strokeStyle = `hsla(${hue}, ${s}%, ${l}%, 0.5)`;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 115, -time * 3, -time * 3 + Math.PI * 0.8);
        ctx.strokeStyle = `hsla(${hue}, ${s}%, ${l}%, 0.3)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      time += state === "processing" ? 0.04 : 0.02;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
    />
  );
};

export default VoiceVisualizer;
