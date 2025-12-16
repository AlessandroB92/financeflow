import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

export const PageTransition = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const compRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(compRef.current, 
        { opacity: 0, y: 15, scale: 0.98 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }
      );
    }, compRef);
    return () => ctx.revert();
  }, []);

  return <div ref={compRef} className={`w-full ${className}`}>{children}</div>;
};
