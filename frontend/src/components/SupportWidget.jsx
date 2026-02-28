/**
 * Floating Support Widget — Draggable
 * Can be freely moved anywhere on screen via touch or mouse drag.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { paymentsAPI } from '../services/api';

export const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [supportLinks, setSupportLinks] = useState({ support_url: '', support_alt_url: '' });

  // Draggable position state
  const [pos, setPos] = useState({ x: null, y: null }); // null means use default bottom-right
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const btnRef = useRef(null);
  const hasDragged = useRef(false);

  // Set initial position (bottom-right)
  useEffect(() => {
    setPos({ x: window.innerWidth - 76, y: window.innerHeight - 76 });
  }, []);

  // Fetch support links
  useEffect(() => {
    paymentsAPI.getPaymentSettings()
      .then(r => setSupportLinks({ support_url: r.data.support_url || '', support_alt_url: r.data.support_alt_url || '' }))
      .catch(() => { });
  }, []);

  const onPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return; // only left click / touch
    hasDragged.current = false;
    dragging.current = true;
    const rect = btnRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - rect.left,
      y: (e.clientY ?? e.touches?.[0]?.clientY ?? 0) - rect.top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const newX = clientX - dragOffset.current.x;
    const newY = clientY - dragOffset.current.y;

    // Clamp within viewport
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;
    setPos({ x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) });
    hasDragged.current = true;
  }, []);

  const onPointerUp = useCallback((e) => {
    dragging.current = false;
    if (!hasDragged.current) {
      // It was a tap/click, not a drag
      setIsOpen(prev => !prev);
    }
  }, []);

  const hasLinks = supportLinks.support_url || supportLinks.support_alt_url;

  // Popup position: above the button
  const popupStyle = pos.y !== null && pos.y < 200
    ? { top: (pos.y || 0) + 66, left: Math.max(8, (pos.x || 0) - 224) }
    : { bottom: window.innerHeight - (pos.y || 0), right: window.innerWidth - (pos.x || 0) - 56, top: 'auto' };

  return (
    <>
      {/* Draggable Chat Button */}
      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'fixed',
          left: pos.x !== null ? `${pos.x}px` : 'auto',
          top: pos.y !== null ? `${pos.y}px` : 'auto',
          right: pos.x === null ? '20px' : 'auto',
          bottom: pos.y === null ? '20px' : 'auto',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1A6FFF 0%, #0066FF 100%)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(26, 111, 255, 0.4)',
          cursor: dragging.current ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        title="Contact Support (drag to move)"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        )}
      </button>

      {/* Support Menu Popup */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: pos.y !== null && pos.y < window.innerHeight - 160 ? 'auto' : `${window.innerHeight - pos.y + 8}px`,
            top: pos.y !== null && pos.y < window.innerHeight - 160 ? `${pos.y + 64}px` : 'auto',
            left: pos.x !== null ? `${Math.max(8, Math.min(pos.x - 140, window.innerWidth - 296))}px` : 'auto',
            right: pos.x === null ? '20px' : 'auto',
            background: 'rgba(13, 30, 53, 0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(26, 111, 255, 0.2)',
            borderRadius: 16,
            padding: '16px',
            width: 280,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            animation: 'slideUpFade 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: '#E8F0FF', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💬 Need Help?</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 16, lineHeight: 1.5 }}>
            Our support team is available 24/7 to assist you with any questions or issues.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hasLinks ? (
              <>
                {supportLinks.support_url && (
                  <a href={supportLinks.support_url} target="_blank" rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    style={{ padding: '10px 14px', background: 'rgba(26, 111, 255, 0.15)', border: '1px solid rgba(26, 111, 255, 0.3)', borderRadius: 12, color: '#1A6FFF', textDecoration: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center', display: 'block' }}
                  >
                    💬 Contact Support
                  </a>
                )}
                {supportLinks.support_alt_url && (
                  <a href={supportLinks.support_alt_url} target="_blank" rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none', fontSize: 14, fontWeight: 500, textAlign: 'center', display: 'block' }}
                  >
                    🔗 Visit Help Center
                  </a>
                )}
              </>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                No support links configured. Please ask admin to set them in the payment settings.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 997 }} />
      )}

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default SupportWidget;
