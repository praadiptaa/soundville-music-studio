import { useEffect, useRef, useState } from 'react';

/**
 * Component Wrapper Animasi Scroll (ScrollAnimation)
 * 
 * @description
 * Wrapper component yang memanfaatkan IntersectionObserver untuk memicu animasi CSS
 * ketika element masuk ke viewport/layar saat user melakukan scroll.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements yang akan dianimasikan
 * @param {string} [props.animation='scale-in'] - Tipe kelas animasi CSS (misal: 'scale-in', 'fade-in')
 * @returns {React.ReactElement} ScrollAnimation element
 */
export default function ScrollAnimation({ children, animation = 'scale-in' }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? `animate-${animation}` : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
