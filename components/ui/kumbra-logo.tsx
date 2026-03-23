'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface KumbraLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function KumbraLogo({ className, width = 160, height = 60 }: KumbraLogoProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const logoSrc = mounted && isDark ? '/logolight.png' : '/logodark.png';

  return (
    <div className={cn('relative', className)}>
      <Image
        src={logoSrc}
        alt="Kumbra Capital"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
