'use client';

import Link from "next/link";
import { Logo } from "@libs/react-shared/ui/logo";
import { useTranslation } from "@/hooks/use-translation";

/**
 * Site-wide footer for all (root) pages: logo, primary navigation, copyright.
 * Rendered by the (root) layout; admin uses its own layout and is unaffected.
 */
export function SiteFooter() {
  const { t, locale } = useTranslation();

  return (
    <footer className="border-t border-border py-10">
      <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-5">
        <Logo size="md" />
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link
            href={`/${locale}/blog`}
            className="hover:text-foreground transition-colors"
          >
            {t.header.navigation.blog}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="hover:text-foreground transition-colors"
          >
            {t.header.navigation.pricing}
          </Link>
        </nav>
        <p className="text-sm text-muted-foreground">
          {t.home.footer.copyright.replace('{year}', new Date().getFullYear().toString())}
        </p>
      </div>
    </footer>
  );
}
