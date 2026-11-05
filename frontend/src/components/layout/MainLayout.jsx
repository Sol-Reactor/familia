import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { cn } from '../../lib/utils';

/**
 * App shell. `wide` gives pages like Messages more horizontal room.
 */
export default function MainLayout({ children, wide = false, title }) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title ? `${title} · Familia` : 'Familia - Stay Connected';
  }, [title]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar />
      <Sidebar />
      <main
        id="main-content"
        tabIndex={-1}
        className="pb-24 pt-4 outline-none sm:pt-6 md:pb-10 lg:ml-64"
      >
        <div className={cn('mx-auto px-3 sm:px-6 lg:px-8', wide ? 'max-w-6xl' : 'max-w-2xl')}>
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
