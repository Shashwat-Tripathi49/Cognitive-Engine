'use client';

import React, { useEffect, useRef } from 'react';
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

/* ─── Particle Constellation Canvas ─────────────────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  targetX: number;
  targetY: number;
}

function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = [
      '#8052ff', '#8052ff', '#8052ff',
      '#ffb829', '#ffb829',
      '#15846e',
      '#b44fff',
      '#4f7fff',
      '#ff4fa0',
      '#00d4ff',
    ];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    /* Brain/cloud shape sampler using superposition of gaussians */
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const brainPoint = (): { x: number; y: number } => {
      const cx = W() * 0.5;
      const cy = H() * 0.46;
      // Lobes
      const lobeOffsets = [
        { dx: -W() * 0.13, dy: -H() * 0.04, rx: W() * 0.22, ry: H() * 0.28 },
        { dx: W() * 0.13, dy: -H() * 0.04, rx: W() * 0.22, ry: H() * 0.28 },
        { dx: 0, dy: H() * 0.08, rx: W() * 0.14, ry: H() * 0.12 },
      ];
      const lobe = lobeOffsets[Math.floor(Math.random() * lobeOffsets.length)];
      return {
        x: cx + lobe.dx + (Math.random() - 0.5) * 2 * lobe.rx,
        y: cy + lobe.dy + (Math.random() - 0.5) * 2 * lobe.ry,
      };
    };

    /* Create particles — 60% in brain shape, 40% ambient */
    const TOTAL = 380;
    const particles: Particle[] = [];

    for (let i = 0; i < TOTAL; i++) {
      const inBrain = i < TOTAL * 0.65;
      const pos = inBrain
        ? brainPoint()
        : { x: Math.random() * W(), y: Math.random() * H() };
      const target = inBrain
        ? brainPoint()
        : { x: Math.random() * W(), y: Math.random() * H() };

      particles.push({
        x: pos.x,
        y: pos.y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: inBrain
          ? Math.random() * 5 + 2
          : Math.random() * 3 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.025,
        opacity: inBrain
          ? Math.random() * 0.55 + 0.35
          : Math.random() * 0.25 + 0.05,
        targetX: target.x,
        targetY: target.y,
      });
    }

    const drawTriangle = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      color: string,
      opacity: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.lineTo(-size * 0.866, size * 0.5);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    };

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, W(), H());
      frame++;

      for (const p of particles) {
        // Gentle drift toward target
        p.vx += (p.targetX - p.x) * 0.0003;
        p.vy += (p.targetY - p.y) * 0.0003;
        // Damping
        p.vx *= 0.97;
        p.vy *= 0.97;
        // Add sinusoidal breath
        p.x += p.vx + Math.sin(frame * 0.008 + p.targetX) * 0.12;
        p.y += p.vy + Math.cos(frame * 0.006 + p.targetY) * 0.10;
        p.rotation += p.rotationSpeed;
        drawTriangle(ctx, p.x, p.y, p.size, p.rotation, p.color, p.opacity);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
}

/* ─── Clerk Appearance — Dark Dala Theme ─────────────────────────────────── */

const clerkAppearance = {
  variables: {
    colorBackground: '#0a0a0a',
    colorInputBackground: '#111111',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#9a9a9a',
    colorTextOnPrimaryBackground: '#ffffff',
    colorPrimary: '#8052ff',
    colorDanger: '#ff4f4f',
    colorSuccess: '#15846e',
    colorNeutral: '#9a9a9a',
    borderRadius: '12px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize: '15px',
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '420px',
    },
    card: {
      background: 'rgba(255,255,255,0.03)',
      boxShadow: 'none',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      backdropFilter: 'blur(12px)',
      padding: '36px 32px',
    },
    cardBox: {
      boxShadow: 'none',
    },
    headerTitle: {
      color: '#ffffff',
      fontSize: '24px',
      fontWeight: '400',
      letterSpacing: '-0.48px',
    },
    headerSubtitle: {
      color: '#9a9a9a',
      fontSize: '14px',
      fontWeight: '400',
    },
    socialButtonsBlockButton: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      color: '#ffffff',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '400',
      transition: 'background 0.15s ease',
    },
    socialButtonsBlockButton__hover: {
      background: 'rgba(128,82,255,0.12)',
    },
    dividerLine: {
      background: 'rgba(255,255,255,0.08)',
    },
    dividerText: {
      color: '#9a9a9a',
      fontSize: '12px',
    },
    formFieldLabel: {
      color: '#9a9a9a',
      fontSize: '12px',
      fontWeight: '400',
      textTransform: 'uppercase',
      letterSpacing: '0.35px',
    },
    formFieldInput: {
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: '400',
    },
    formFieldInputShowPasswordButton: {
      color: '#9a9a9a',
    },
    formButtonPrimary: {
      background: '#8052ff',
      color: '#ffffff',
      borderRadius: '24px',
      fontSize: '14px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.35px',
      padding: '14px 20px',
      boxShadow: 'none',
      transition: 'opacity 0.15s ease',
    },
    footerActionText: {
      color: '#9a9a9a',
      fontSize: '14px',
    },
    footerActionLink: {
      color: '#8052ff',
      fontSize: '14px',
      fontWeight: '400',
    },
    identityPreviewText: {
      color: '#ffffff',
    },
    identityPreviewEditButton: {
      color: '#8052ff',
    },
    formResendCodeLink: {
      color: '#8052ff',
    },
    alert: {
      background: 'rgba(255, 79, 79, 0.08)',
      border: '1px solid rgba(255, 79, 79, 0.20)',
      borderRadius: '10px',
    },
    alertText: {
      color: '#ff8080',
    },
    otpCodeFieldInput: {
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '10px',
      color: '#ffffff',
    },
  },
};

/* ─── Sign-In Page ───────────────────────────────────────────────────────── */

export default function SignInPage() {
  return (
    <div
      id="sign-in-page"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* ── Particle constellation (full page) */}
      <ConstellationCanvas />

      {/* ── Radial glow behind form area */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(128,82,255,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Content layout: two-column asymmetric */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 480px',
          alignItems: 'center',
          padding: '60px 48px',
          gap: '48px',
          boxSizing: 'border-box',
        }}
        className="sign-in-layout"
      >
        {/* ── LEFT: Hero copy */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          {/* Logo lockup */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              width: 'fit-content',
            }}
          >
            {/* Geometric violet logo mark */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <polygon
                points="14,2 26,24 2,24"
                stroke="#8052ff"
                strokeWidth="1.5"
                fill="none"
              />
              <polygon
                points="14,8 21,20 7,20"
                stroke="#15846e"
                strokeWidth="1"
                fill="rgba(128,82,255,0.12)"
              />
            </svg>
            <span
              style={{
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                letterSpacing: '0.02em',
              }}
            >
              Cognitive Engine
            </span>
          </Link>

          {/* Amber label */}
          <span
            style={{
              color: '#ffb829',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.35px',
            }}
          >
            Personal Memory Retrieval
          </span>

          {/* Display headline */}
          <h1
            style={{
              color: '#ffffff',
              fontSize: 'clamp(48px, 6vw, 78px)',
              fontWeight: '400',
              lineHeight: 1.1,
              letterSpacing: '-3.12px',
              margin: 0,
            }}
          >
            Your thinking,
            <br />
            <span
              style={{
                background:
                  'linear-gradient(90deg, #8052ff 0%, #b44fff 50%, #ffb829 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              organized.
            </span>
          </h1>

          {/* Body copy — weight 200 per Dala spec */}
          <p
            style={{
              color: '#bdbdbd',
              fontSize: '18px',
              fontWeight: '200',
              lineHeight: '1.5',
              maxWidth: '460px',
              margin: 0,
            }}
          >
            Capture fragments of thought, surface forgotten connections, and
            retrieve what matters — through a cryptographically anchored memory
            ledger built for the way you actually think.
          </p>

          {/* Ghost detail line */}
          <p
            style={{
              color: '#9a9a9a',
              fontSize: '12px',
              fontWeight: '400',
              letterSpacing: '0.35px',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Knowledge graph · Reasoning engine · Cryptographic hashing
          </p>
        </div>

        {/* ── RIGHT: Clerk sign-in form */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <SignIn
            appearance={clerkAppearance}
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        </div>
      </div>

      {/* ── Footer */}
      <footer
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#9a9a9a',
          fontSize: '12px',
          fontWeight: '400',
          letterSpacing: '0.25px',
          zIndex: 1,
          whiteSpace: 'nowrap',
        }}
      >
        © {new Date().getFullYear()} Cognitive Engine. All rights reserved.
      </footer>

      {/* ── Responsive styles injected */}
      <style>{`
        @media (max-width: 860px) {
          .sign-in-layout {
            grid-template-columns: 1fr !important;
            padding: 48px 24px !important;
            justify-items: center;
          }
          .sign-in-layout > div:first-child {
            text-align: center;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
