import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

// A restrained scroll-reveal: content starts slightly lowered and faded, then eases
// into place when it first enters the viewport. Honours prefers-reduced-motion
// (shows immediately, no transform). Deliberately slow and quiet — the point is
// composure, not flourish.
interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number; // seconds
  y?: number;     // starting offset in px
}

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const Reveal = ({ children, as, className = "", delay = 0, y = 24 }: RevealProps) => {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(prefersReduced);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transition: "opacity 900ms cubic-bezier(0.22, 1, 0.36, 1), transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: `${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
