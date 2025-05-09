import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    if (!isLandingPage) return;
    
    const cursor = cursorRef.current;
    
    const moveCursor = (e) => {
      requestAnimationFrame(() => {
        if (cursor) {
          cursor.style.left = `${e.clientX}px`;
          cursor.style.top = `${e.clientY}px`;
        }
      });
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [isLandingPage]);

  if (!isLandingPage) return null;

  return <div ref={cursorRef} className="cursor-dot" />;
};

export default CustomCursor;