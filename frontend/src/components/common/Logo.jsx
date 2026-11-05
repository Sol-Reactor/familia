import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

const sizes = {
  sm: 'text-xl sm:text-2xl',
  md: 'text-3xl',
  lg: 'text-5xl sm:text-6xl',
};

/**
 * Familia wordmark with the brand gradient.
 * The gradient (background-clip: text) and the entrance motion live on the SAME
 * element - animating child letters with transforms makes Chromium drop the
 * clipped gradient, which used to make letters disappear.
 * All motion is disabled for prefers-reduced-motion users.
 */
export default function Logo({ size = 'sm', animated = true, className }) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animated && !reduceMotion;

  return (
    <motion.span
      initial={shouldAnimate ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'brand-gradient-text inline-block pb-[0.08em] font-extrabold leading-none tracking-tight',
        shouldAnimate && 'animate-gradient-x',
        sizes[size],
        className
      )}
    >
      Familia
    </motion.span>
  );
}
