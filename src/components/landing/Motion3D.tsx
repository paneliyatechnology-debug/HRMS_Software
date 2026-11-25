'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';

/**
 * Interactive 3D pointer-tilt container with smooth spring-like return and optional specular glare.
 */
export const Tilt3D: React.FC<{
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}> = ({ children, className = '', intensity = 9, glare = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const ry = (px - 0.5) * intensity * 2;
      const rx = (0.5 - py) * intensity * 2;
      setTilt({ rx, ry, gx: px * 100, gy: py * 100, active: true });
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    setTilt((prev) => ({ ...prev, rx: 0, ry: 0, active: false }));
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`[perspective:1300px] ${className}`}
    >
      <div
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) ${tilt.active ? 'translateZ(10px)' : 'translateZ(0px)'}`,
          transformStyle: 'preserve-3d',
          transition: tilt.active
            ? 'transform 110ms ease-out'
            : 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="relative w-full h-full"
      >
        {children}
        {glare && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
            style={{
              opacity: tilt.active ? 0.55 : 0,
              background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.45), transparent 55%)`,
            }}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Scroll-triggered 3D perspective entrance wrapper.
 */
export const Reveal3D: React.FC<{
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}> = ({ children, className = '', delayMs = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`[perspective:1200px] ${className}`}>
      <div
        style={{
          transitionDelay: `${delayMs}ms`,
          transform: visible
            ? 'translateY(0px) rotateX(0deg) scale(1)'
            : 'translateY(26px) rotateX(9deg) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 680ms cubic-bezier(0.16, 1, 0.3, 1), opacity 550ms ease-out',
        }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Subtle animated 3D perspective grid + floating isometric glass prisms.
 */
export const Ambient3DScene: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966909_1px,transparent_1px),linear-gradient(to_bottom,#05966909_1px,transparent_1px)] bg-[size:36px_36px]" />
    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[960px] h-[520px] bg-gradient-to-tr from-emerald-300/20 via-teal-200/15 to-emerald-100/25 rounded-full blur-3xl animate-pulse" />
    <div
      className="hidden lg:block absolute top-28 right-12 w-24 h-24 rounded-3xl bg-gradient-to-br from-[#d8f3dc]/65 to-white/50 border border-[#95d5b2]/55 shadow-xl backdrop-blur-xs animate-float-subtle"
      style={{ transform: 'perspective(900px) rotateX(24deg) rotateY(-18deg) rotateZ(12deg)' }}
    />
    <div
      className="hidden lg:block absolute top-[440px] left-8 w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-200/45 to-white/70 border border-emerald-200/60 shadow-lg animate-float-subtle"
      style={{ animationDelay: '1.2s', transform: 'perspective(900px) rotateX(-18deg) rotateY(24deg)' }}
    />
    <div
      className="hidden xl:block absolute top-52 left-[46%] w-10 h-10 rounded-xl bg-white/70 border border-emerald-200/70 shadow-md animate-float-subtle"
      style={{ animationDelay: '0.6s', transform: 'perspective(900px) rotateX(15deg) rotateY(30deg)' }}
    />
  </div>
);

/**
 * Shared 3D Bottom CTA Banner for landing & sub-pages.
 */
export const BottomCta3D: React.FC<{
  title: string;
  subtitle: string;
  primaryLabel?: string;
  onOpenLogin?: () => void;
}> = ({ title, subtitle, primaryLabel = 'Launch Company Workspace', onOpenLogin }) => (
  <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white relative overflow-hidden">
    <div
      aria-hidden="true"
      className="hidden md:block absolute -top-10 -left-10 w-44 h-44 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xs pointer-events-none animate-float-subtle"
      style={{ transform: 'perspective(800px) rotateX(24deg) rotateY(20deg) rotateZ(12deg)' }}
    />
    <div
      aria-hidden="true"
      className="hidden md:block absolute -bottom-12 -right-8 w-52 h-52 rounded-3xl bg-emerald-300/10 border border-emerald-200/15 backdrop-blur-xs pointer-events-none animate-float-subtle"
      style={{ animationDelay: '1.1s', transform: 'perspective(800px) rotateX(-20deg) rotateY(-18deg) rotateZ(-10deg)' }}
    />
    <Reveal3D className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">{title}</h2>
        <p className="text-xs sm:text-sm text-[#d8f3dc] max-w-xl mx-auto leading-relaxed">{subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white hover:bg-[#d8f3dc] text-[#1b4332] font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{primaryLabel}</span>
            <ArrowRight className="w-4 h-4 text-[#1b4332]" />
          </Link>
          <Link
            href="/login"
            onClick={onOpenLogin}
            className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-emerald-950/60 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm border border-emerald-400/40 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#d8f3dc]" />
            <span>Sign In to Portal</span>
          </Link>
        </div>
      </div>
    </Reveal3D>
  </section>
);
