import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Heart, Users } from 'lucide-react';
import Logo from '../common/Logo';

const highlights = [
  { icon: Users, text: 'Find friends and family' },
  { icon: MessageCircle, text: 'Chat in real time' },
  { icon: Heart, text: 'Share the moments that matter' },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Soft brand glow - decorative */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-pink-500/15 blur-3xl" />

      <main className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Brand panel */}
        <section className="text-center lg:text-left">
          <Logo size="lg" />
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Connect with friends and family around you.
          </p>
          <ul className="mt-8 hidden space-y-4 lg:block">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-foreground">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Form card */}
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mx-auto w-full max-w-md"
          aria-labelledby="auth-title"
        >
          <div className="rounded-2xl border bg-card p-6 shadow-pop sm:p-8">
            <header className="mb-6 text-center">
              <h1 id="auth-title" className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </header>
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </motion.section>
      </main>
    </div>
  );
}
