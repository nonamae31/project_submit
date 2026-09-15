'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="sm" className="w-9 px-0" />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-9 px-0"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title="Toggle theme"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
