'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface JournalCalendarProps {
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * JournalCalendar — Authentic Botanical Bullet Journal Spread
 *
 * Implements the user's uploaded reference artwork:
 * - Torn kraft brown paper along the left edge
 * - Hand-drawn climbing botanical wild rose vines and blooming flowers with warm amber/ochre watercolor wash
 * - Clean dotted grid paper in the upper-right quadrant
 * - Interactive month navigation, weekday indicators, and clickable day cells
 */
export function JournalCalendar({ onSelectDate, selectedDate }: JournalCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [displayedDate, setDisplayedDate] = useState<Date>(selectedDate || today);

  const year = displayedDate.getFullYear();
  const month = displayedDate.getMonth();
  const monthName = MONTH_NAMES[month];

  const { daysInMonth, startOffset } = useMemo(() => {
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    return { daysInMonth: days, startOffset: firstDay };
  }, [year, month]);

  const handlePrevMonth = () => {
    setDisplayedDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayedDate(new Date(year, month + 1, 1));
  };

  const isCurrentMonthToday =
    today.getFullYear() === year && today.getMonth() === month;

  const formattedSelected = (selectedDate || today).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '450px',
        aspectRatio: '845 / 1024',
        minHeight: '520px',
        backgroundColor: '#FAF8F3',
        borderRadius: '12px',
        overflow: 'hidden',
        userSelect: 'none',
        border: '1.5px solid rgba(80, 65, 50, 0.28)',
        boxShadow:
          '0 16px 40px rgba(43, 35, 26, 0.12), 0 3px 8px rgba(43, 35, 26, 0.05)',
      }}
    >
      {/* Authentic Botanical Bullet Journal Artwork Backdrop */}
      <Image
        src="/wild-rose-clean.jpg"
        alt="Botanical Wild Rose Bullet Journal Spread"
        fill
        sizes="(max-width: 768px) 100vw, 450px"
        style={{
          objectFit: 'cover',
          zIndex: 0,
        }}
        priority
      />

      {/* Interactive Calendar Overlay positioned over the open Dotted Journal Area */}
      <div
        style={{
          position: 'absolute',
          top: '3.5%',
          left: '27%',
          right: '5%',
          bottom: '28%',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: '12px',
          boxSizing: 'border-box',
          padding: '6px 4px 4px 6px',
        }}
      >
        {/* Month Header & Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px dashed rgba(80, 65, 50, 0.3)',
            paddingBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2
              id="calendar-heading"
              style={{
                fontFamily: 'var(--font-headline), var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '1.65rem',
                fontWeight: 700,
                color: '#281E15',
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {monthName}{' '}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontStyle: 'normal',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#6E5A48',
                  marginLeft: '4px',
                }}
              >
                {year}
              </span>
            </h2>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '0.78rem',
                color: '#6E5A48',
                letterSpacing: '0.02em',
                marginTop: '2px',
              }}
            >
              Wild Rose & Reflections
            </span>
          </div>

          {/* Month Navigation Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              style={{
                background: 'rgba(250, 248, 243, 0.75)',
                border: '1px solid rgba(80, 65, 50, 0.35)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                color: '#4A3B2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              style={{
                background: 'rgba(250, 248, 243, 0.75)',
                border: '1px solid rgba(80, 65, 50, 0.35)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                color: '#4A3B2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              ›
            </button>
          </div>
        </div>

        {/* Compact Calendar Days Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Weekday Labels: M T W T F S S */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#3E3024',
              paddingBottom: '3px',
              borderBottom: '1px solid rgba(90, 72, 56, 0.25)',
            }}
          >
            {WEEKDAYS.map((day, i) => (
              <span key={`${day}-${i}`}>{day}</span>
            ))}
          </div>

          {/* Day Numbers Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px 0',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.74rem',
            }}
          >
            {Array.from({ length: startOffset }).map((_, i) => (
              <span key={`offset-${i}`} style={{ opacity: 0 }}>
                •
              </span>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isToday = isCurrentMonthToday && today.getDate() === dayNum;
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === year &&
                selectedDate.getMonth() === month &&
                selectedDate.getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => {
                    const chosen = new Date(year, month, dayNum);
                    if (onSelectDate) onSelectDate(chosen);
                  }}
                  title={`Select ${monthName} ${dayNum}, ${year}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '3px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    color: isToday
                      ? '#FAF8F3'
                      : isSelected
                        ? '#281E15'
                        : '#3E3024',
                    fontWeight: isToday || isSelected ? 700 : 500,
                  }}
                >
                  {isToday && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        width: '22px',
                        height: '22px',
                        backgroundColor: '#281E15',
                        borderRadius: '50%',
                        zIndex: -1,
                        boxShadow: '0 2px 4px rgba(40, 30, 20, 0.35)',
                      }}
                    />
                  )}

                  {!isToday && isSelected && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        width: '22px',
                        height: '22px',
                        border: '1.5px dashed #B85D36',
                        borderRadius: '50%',
                        zIndex: -1,
                      }}
                    />
                  )}

                  <span style={{ position: 'relative', zIndex: 1 }}>{dayNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date & Quick Link to Ledger */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px dashed rgba(80, 65, 50, 0.25)',
            paddingTop: '6px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: '#5A4635',
              letterSpacing: '0.04em',
            }}
          >
            ● {formattedSelected}
          </span>
          <Link
            href="/archives"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.64rem',
              fontWeight: 700,
              color: '#281E15',
              textDecoration: 'underline',
              letterSpacing: '0.02em',
            }}
          >
            Ledger →
          </Link>
        </div>
      </div>
    </div>
  );
}
