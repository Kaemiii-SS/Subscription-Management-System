import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global persistent Vanta.js TOPOLOGY background.
 * Active across application pages (Operations, Catalog & Rules, Portal, etc.)
 * Automatically hidden on Login/Signup pages so Unicorn Studio background renders cleanly.
 */
export default function VantaBackground() {
  const vantaRef = useRef(null);
  const effectRef = useRef(null);
  const location = useLocation();

  const isAuthRoute = ['/login', '/signup', '/forgot-password', '/reset-password'].some((path) =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    // Respect prefers-reduced-motion preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let isCancelled = false;

    const initTopology = () => {
      if (isCancelled || effectRef.current || !vantaRef.current) return;

      if (window.VANTA && typeof window.VANTA.TOPOLOGY === 'function') {
        try {
          effectRef.current = window.VANTA.TOPOLOGY({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            backgroundColor: 0x002222,
            color: 0x9ec14c,
          });
        } catch (err) {
          console.warn('Vanta.js Topology initialization encountered an error:', err);
        }
      }
    };

    // Try immediately
    initTopology();

    // In case external CDN script tags in index.html are still being evaluated
    const interval = setInterval(() => {
      if (effectRef.current || isCancelled) {
        clearInterval(interval);
      } else {
        initTopology();
      }
    }, 150);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
      if (effectRef.current && typeof effectRef.current.destroy === 'function') {
        try {
          effectRef.current.destroy();
        } catch (err) {
          console.warn('Error destroying Vanta instance:', err);
        }
        effectRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id="vanta-bg"
      ref={vantaRef}
      aria-hidden="true"
      style={{ display: isAuthRoute ? 'none' : 'block' }}
    />
  );
}
