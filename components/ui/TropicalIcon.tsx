interface TropicalIconProps {
  name: 'palm' | 'wave' | 'sun' | 'flower' | 'bird' | 'volcano' | 'beach' | 'pura-vida';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

/**
 * Tropical Icon Component
 * 
 * Costa Rica-themed SVG icons with optional animations.
 * Provides consistent tropical branding across the application.
 */
export function TropicalIcon({
  name,
  size = 'md',
  className = '',
  animate = false,
}: TropicalIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const animationClass = animate ? 'animate-wave' : '';

  const icons = {
    palm: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClasses[size]} ${animationClass} ${className}`}
        aria-label="Palm tree"
      >
        <path d="M12 22V8" />
        <path d="M12 8c-2-2-4-3-6-3s-3 1-3 3 1 3 3 3 4-1 6-3z" />
        <path d="M12 8c2-2 4-3 6-3s3 1 3 3-1 3-3 3-4-1-6-3z" />
        <path d="M12 8c0-3 0-5-2-7" />
        <path d="M12 8c0-3 0-5 2-7" />
      </svg>
    ),
    wave: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClasses[size]} ${animationClass} ${className}`}
        aria-label="Ocean wave"
      >
        <path d="M2 12c.6-2.5 2.5-4 4.5-4 2.5 0 3.5 2 5.5 2s3-2 5.5-2c2 0 3.9 1.5 4.5 4" />
        <path d="M2 17c.6-2.5 2.5-4 4.5-4 2.5 0 3.5 2 5.5 2s3-2 5.5-2c2 0 3.9 1.5 4.5 4" />
      </svg>
    ),
    sun: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClasses[size]} ${animationClass} ${className}`}
        aria-label="Sun"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
    flower: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClasses[size]} ${animationClass} ${className}`}
        aria-label="Tropical flower"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2a3 3 0 0 0-3 3v4" />
        <path d="M12 22a3 3 0 0 0 3-3v-4" />
        <path d="M2 12a3 3 0 0 0 3-3h4" />
        <path d="M22 12a3 3 0 0 0-3 3h-4" />
        <path d="m6.34 6.34 2.12 2.12" />
        <path d="m15.54 15.54 2.12 2.12" />
        <path d="m6.34 17.66 2.12-2.12" />
        <path d="m15.54 8.46 2.12-2.12" />
      </svg>
    ),
    bird: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClasses[size]} ${animationClass} ${className}`}
        aria-label="Tropical bird"
      >
        <path d="M16 7h.01" />
        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
        <path d="m20 7 2 .5-2 .5" />
        <path d="M10 18v3" />
        <path d="M14 17.75V21" />
        <path d="M7 18a6 6 0 0 0 3.84-10.61" />
      </svg>
    ),
    volcano: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClasses[size]} ${animationClass} ${className}`}
        aria-label="Volcano"
      >
        <path d="m8 2 1.88 1.88" />
        <path d="M14.12 3.88 16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
        <path d="M12 20v-9" />
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
        <path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M22 13h-4" />
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
      </svg>
    ),
    beach: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${sizeClasses[size]} ${animationClass} ${className}`}
        aria-label="Beach"
      >
        <path d="M2 22h20" />
        <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12l.1.05a2 2 0 0 0 1.8 0l.17-.1a2 2 0 0 1 1.8 0L13 12l.1.05a2 2 0 0 0 1.8 0l.17-.1a2 2 0 0 1 1.8 0l1.1.55L20 17l-2.36.4" />
        <path d="M2 22 8 6" />
        <path d="M22 22 16 6" />
      </svg>
    ),
    'pura-vida': (
      <svg
        viewBox="0 0 100 40"
        fill="currentColor"
        className={`${sizeClasses[size]} ${animationClass} ${className}`}
        aria-label="Pura Vida"
      >
        <text
          x="50"
          y="25"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Pura Vida
        </text>
        <path d="M10 30 Q 50 20, 90 30" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  };

  return icons[name];
}
