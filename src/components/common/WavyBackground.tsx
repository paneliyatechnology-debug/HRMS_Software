 'use client';

import React from 'react';

/**
 * High-End Generative Wavy Contour Background Layer
 * Renders undulating organic wave lines across the entire UI canvas.
 */
export const WavyBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Ambient Radial Color Washes */}
      <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-emerald-400/12 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-[750px] h-[750px] rounded-full bg-teal-400/10 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 w-[700px] h-[700px] rounded-full bg-emerald-500/10 blur-3xl" />

      {/* SVG Flowing Wavy Lines Layer */}
      <svg
        className="absolute inset-0 w-full h-full opacity-80"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="wave-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="80%" stopColor="#059669" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="wave-grad-mint" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#059669" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="wave-grad-dark" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.38" />
            <stop offset="50%" stopColor="#059669" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* --- Band 1: Upper Sky Waves --- */}
        <path
          d="M -100,70 C 220,10 480,160 820,80 C 1160,0 1520,150 2050,60"
          stroke="url(#wave-grad-emerald)"
          strokeWidth="2"
        />
        <path
          d="M -100,120 C 250,50 510,210 850,130 C 1190,50 1550,200 2050,110"
          stroke="url(#wave-grad-mint)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <path
          d="M -100,175 C 280,95 540,260 880,180 C 1220,100 1580,250 2050,160"
          stroke="url(#wave-grad-dark)"
          strokeWidth="1.8"
        />

        {/* --- Band 2: Upper-Mid Undulations --- */}
        <path
          d="M -100,280 C 340,380 690,190 1060,300 C 1430,410 1730,230 2050,310"
          stroke="url(#wave-grad-emerald)"
          strokeWidth="2.2"
        />
        <path
          d="M -100,330 C 360,430 710,240 1080,350 C 1450,460 1750,280 2050,360"
          stroke="url(#wave-grad-mint)"
          strokeWidth="1.4"
          strokeDasharray="10 8"
        />
        <path
          d="M -100,385 C 380,485 730,295 1100,405 C 1470,515 1770,335 2050,415"
          stroke="url(#wave-grad-dark)"
          strokeWidth="1.6"
        />

        {/* --- Band 3: Center Fluid Ribbons --- */}
        <path
          d="M -100,500 C 270,620 730,410 1140,540 C 1550,670 1810,470 2050,550"
          stroke="url(#wave-grad-emerald)"
          strokeWidth="2.5"
        />
        <path
          d="M -100,550 C 290,670 750,460 1160,590 C 1570,720 1830,520 2050,600"
          stroke="url(#wave-grad-mint)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />
        <path
          d="M -100,605 C 310,725 770,515 1180,645 C 1590,775 1850,575 2050,655"
          stroke="url(#wave-grad-dark)"
          strokeWidth="2"
        />

        {/* --- Band 4: Lower-Mid Curves --- */}
        <path
          d="M -100,720 C 350,640 690,860 1110,750 C 1530,640 1770,850 2050,760"
          stroke="url(#wave-grad-emerald)"
          strokeWidth="2"
        />
        <path
          d="M -100,775 C 370,695 710,915 1130,805 C 1550,695 1790,905 2050,815"
          stroke="url(#wave-grad-mint)"
          strokeWidth="1.4"
          strokeDasharray="12 8"
        />
        <path
          d="M -100,830 C 390,750 730,970 1150,860 C 1570,750 1810,960 2050,870"
          stroke="url(#wave-grad-dark)"
          strokeWidth="2.2"
        />

        {/* --- Band 5: Bottom Horizon Waves --- */}
        <path
          d="M -100,940 C 410,850 840,1040 1240,930 C 1640,820 1870,1000 2050,940"
          stroke="url(#wave-grad-emerald)"
          strokeWidth="2"
        />
        <path
          d="M -100,995 C 430,905 860,1095 1260,985 C 1660,875 1890,1055 2050,995"
          stroke="url(#wave-grad-mint)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <path
          d="M -100,1050 C 450,960 880,1150 1280,1040 C 1680,930 1910,1110 2050,1050"
          stroke="url(#wave-grad-dark)"
          strokeWidth="2.2"
        />
      </svg>
    </div>
  );
};
