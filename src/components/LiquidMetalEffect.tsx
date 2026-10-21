'use client';

import React, { useEffect } from 'react';

/**
 * LiquidMetalEffect
 * Adds dynamic liquid mercury ripple & fluid deformation to all buttons on click.
 */
export const LiquidMetalEffect: React.FC = () => {
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const button = target.closest('button') as HTMLButtonElement | null;
      if (!button || button.disabled) return;

      // Ensure button can host absolute ripple and doesn't clip unexpectedly
      const rect = button.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Calculate diameter to cover button
      const size = Math.max(rect.width, rect.height) * 2.2;

      // Create primary liquid ripple droplet
      const ripple = document.createElement('span');
      ripple.className = 'liquid-metal-blob';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      // Create secondary metallic specular splash ring
      const ring = document.createElement('span');
      ring.className = 'liquid-metal-ring';
      ring.style.width = `${size * 0.8}px`;
      ring.style.height = `${size * 0.8}px`;
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;

      button.classList.add('liquid-metal-active');
      button.appendChild(ripple);
      button.appendChild(ring);

      setTimeout(() => {
        ripple.remove();
        ring.remove();
        button.classList.remove('liquid-metal-active');
      }, 700);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return null;
};
