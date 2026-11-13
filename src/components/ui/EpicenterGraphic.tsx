import React from "react";

interface EpicenterGraphicProps {
  className?: string;
  depthKm?: number;
}

/**
 * Visualisasi Episentrum Seismik
 * Presisi tinggi bergaya instrumen seismologi (radar konsentris & radius jangkauan getaran)
 * Mengikuti DESIGN.md: Flat, garis tipis presisi, tanpa dekorasi semu / AI slop.
 */
export const EpicenterGraphic: React.FC<EpicenterGraphicProps> = ({
  className = "",
  depthKm = 10,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none shrink-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-36 h-36 sm:w-40 sm:h-40"
      >
        {/* Garis silang bidik aksial (Crosshairs arah mata angin) */}
        <line
          x1="20"
          y1="80"
          x2="140"
          y2="80"
          stroke="var(--color-border)"
          strokeWidth="0.75"
          strokeDasharray="3 3"
        />
        <line
          x1="80"
          y1="20"
          x2="80"
          y2="140"
          stroke="var(--color-border)"
          strokeWidth="0.75"
          strokeDasharray="3 3"
        />

        {/* Cincin jarak 75 km (terluar, putus-putus) */}
        <circle
          cx="80"
          cy="80"
          r="66"
          stroke="var(--color-border)"
          strokeWidth="0.75"
          strokeDasharray="4 4"
        />

        {/* Cincin jarak 50 km */}
        <circle
          cx="80"
          cy="80"
          r="48"
          stroke="var(--color-border-strong)"
          strokeWidth="0.75"
          opacity="0.5"
        />

        {/* Cincin jarak 25 km */}
        <circle
          cx="80"
          cy="80"
          r="30"
          stroke="var(--color-primary)"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Cincin dekat episentrum */}
        <circle
          cx="80"
          cy="80"
          r="14"
          stroke="var(--color-primary)"
          strokeWidth="1.25"
          opacity="0.85"
        />

        {/* Titik pusat episentrum */}
        <circle
          cx="80"
          cy="80"
          r="4.5"
          fill="var(--color-primary)"
        />

        {/* Pulsa seismik halus */}
        <circle
          cx="80"
          cy="80"
          r="8"
          stroke="var(--color-primary)"
          strokeWidth="1"
          opacity="0.4"
          className="motion-safe:animate-ping origin-center"
        />

        {/* Penanda arah mata angin kecil */}
        <text
          x="80"
          y="14"
          textAnchor="middle"
          fill="var(--color-text-secondary)"
          fontSize="8"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          opacity="0.7"
        >
          U
        </text>
        <text
          x="152"
          y="83"
          textAnchor="middle"
          fill="var(--color-text-secondary)"
          fontSize="8"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          opacity="0.7"
        >
          T
        </text>
        <text
          x="80"
          y="154"
          textAnchor="middle"
          fill="var(--color-text-secondary)"
          fontSize="8"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          opacity="0.7"
        >
          S
        </text>
        <text
          x="8"
          y="83"
          textAnchor="middle"
          fill="var(--color-text-secondary)"
          fontSize="8"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          opacity="0.7"
        >
          B
        </text>

        {/* Label skala jangkauan getaran */}
        <text
          x="114"
          y="76"
          fill="var(--color-text-secondary)"
          fontSize="7"
          fontFamily="system-ui, sans-serif"
          opacity="0.65"
        >
          50 km
        </text>
      </svg>
    </div>
  );
};
