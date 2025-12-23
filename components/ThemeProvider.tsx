'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return <>{children}</>;
}
