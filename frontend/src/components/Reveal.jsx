// useScrollReveal — lightweight Intersection Observer hook
import { useEffect, useRef, useState } from "react";

/**
 * @param {object} options
 * @param {string} [options.direction] — "bottom" | "left" | "right"
 * @param {number} [options.delay]     — ms delay
 * @param {number} [options.threshold] — 0‥1
 */
export function useScrollReveal({ direction = "bottom", delay = 0, threshold = 0.15 } = {}) {
  const ref      = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  let initialClass = "reveal-initial";
  let visClass     = "reveal-visible";
  if (direction === "left")  { initialClass = "reveal-initial-left";  visClass = "reveal-visible-x"; }
  if (direction === "right") { initialClass = "reveal-initial-right"; visClass = "reveal-visible-x"; }

  const style = delay && vis ? { transitionDelay: `${delay}ms` } : {};

  return { ref, className: vis ? visClass : initialClass, style };
}

/**
 * Reveal wrapper component.
 *
 * Usage:
 *   <Reveal direction="left" delay={100}>
 *     <YourComponent />
 *   </Reveal>
 */
export default function Reveal({ children, direction = "bottom", delay = 0, threshold = 0.15 }) {
  const { ref, className, style } = useScrollReveal({ direction, delay, threshold });
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
