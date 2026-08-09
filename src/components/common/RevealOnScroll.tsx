import React from 'react';
import { motion } from 'motion/react';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  duration?: number;
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className = '',
  delay = 0,
  yOffset = 24, // Slightly reduced from 30 for cleaner pixels
  duration = 0.65, // Bumped up slightly to let the smooth deceleration shine
}) => {
  return (
    <motion.div
      // style line enforces hardware acceleration to stop browser skipping
      style={{ backfaceVisibility: 'hidden', willChange: 'transform, opacity' }}
      initial={{ opacity: 0, y: yOffset, scale: 0.95 }} // 0.95 is cleaner and less jarring than 0.92
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-20px' }} // Adjusted to -20px so it triggers slightly sooner
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Ultra-smooth, high-end professional easing (Ease-Out Expo)
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
