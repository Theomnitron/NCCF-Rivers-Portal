import React from 'react';

interface NccfLogoProps {
  className?: string;
  size?: number | string;
}

export const NccfLogo: React.FC<NccfLogoProps> = ({ className = "w-12 h-12", size }) => {
  return (
    <img
      src="/nccf-logo.png"
      alt="NCCF Rivers State Logo"
      className={`object-contain flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
};
