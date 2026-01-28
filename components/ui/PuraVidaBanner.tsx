import { TropicalIcon } from './TropicalIcon';

interface PuraVidaBannerProps {
  variant?: 'header' | 'footer' | 'inline';
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

/**
 * Pura Vida Banner Component
 * 
 * Displays the "Pura Vida" branding with Costa Rica theming.
 * Can be used in headers, footers, or inline within content.
 */
export function PuraVidaBanner({
  variant = 'inline',
  showIcon = true,
  animate = false,
  className = '',
}: PuraVidaBannerProps) {
  const variantStyles = {
    header: 'text-2xl sm:text-3xl font-bold text-jungle-600',
    footer: 'text-lg sm:text-xl font-semibold text-sage-700',
    inline: 'text-base sm:text-lg font-medium text-jungle-500',
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {showIcon && (
        <TropicalIcon name="sun" size={variant === 'header' ? 'lg' : 'md'} animate={animate} className="text-sunset-500" />
      )}
      <span className={variantStyles[variant]}>Pura Vida!</span>
      {showIcon && (
        <TropicalIcon name="palm" size={variant === 'header' ? 'lg' : 'md'} animate={animate} className="text-jungle-500" />
      )}
    </div>
  );
}

/**
 * Costa Rica Header Component
 * 
 * Full header with Costa Rica branding and tropical elements.
 */
export function CostaRicaHeader() {
  return (
    <header className="bg-gradient-to-r from-jungle-500 via-ocean-500 to-sunset-500 text-white py-6 safe-top">
      <div className="container-responsive">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-3">
            <TropicalIcon name="palm" size="xl" animate className="text-white" />
            <h1 className="text-responsive-xl font-bold">Costa Rica Wedding</h1>
            <TropicalIcon name="wave" size="xl" animate className="text-white" />
          </div>
          <PuraVidaBanner variant="inline" showIcon={false} className="text-white opacity-90" />
        </div>
      </div>
    </header>
  );
}

/**
 * Costa Rica Footer Component
 * 
 * Footer with Costa Rica branding and tropical elements.
 */
export function CostaRicaFooter() {
  return (
    <footer className="bg-sage-900 text-white py-8 mt-12 safe-bottom">
      <div className="container-responsive">
        <div className="flex flex-col items-center space-y-4">
          <PuraVidaBanner variant="footer" className="text-white" />
          
          <div className="flex items-center space-x-6 text-sm text-sage-400">
            <div className="flex items-center space-x-2">
              <TropicalIcon name="beach" size="sm" />
              <span>Costa Rica</span>
            </div>
            <div className="flex items-center space-x-2">
              <TropicalIcon name="flower" size="sm" />
              <span>Destination Wedding</span>
            </div>
            <div className="flex items-center space-x-2">
              <TropicalIcon name="bird" size="sm" />
              <span>2025</span>
            </div>
          </div>
          
          <p className="text-xs text-sage-500 text-center">
            Made with ❤️ for an unforgettable celebration
          </p>
        </div>
      </div>
    </footer>
  );
}
