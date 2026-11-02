import Link from "next/link";
import { Mail } from "lucide-react"; // Import icons

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    // Apply solid background color and adjust text color
    <footer className="border-t bg-orange-600 text-primary-foreground">
      <div className="container flex flex-col items-center justify-center gap-4 py-8 text-sm md:flex-row md:justify-between px-4 md:px-6">
        {/* Use text-primary-foreground for better contrast on gradient */}
        <p className="text-center md:text-left text-primary-foreground/90">
          &copy; {currentYear} LADDU ZABARDAST. All rights reserved.
        </p>
        <nav className="flex gap-4 items-center">
          {/* Social Links - Use text-primary-foreground for hover on gradient */}
          <Link
            href="https://www.linkedin.com/in/laddu-zabardast-neetu-singh-a293622a7/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors"
            aria-label="LinkedIn"
          >
            <LinkedinIcon className="h-5 w-5" />
          </Link>
          <Link
            href="https://www.instagram.com/laddu_zabardast/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors"
            aria-label="Instagram"
          >
            <InstagramIcon className="h-5 w-5" />
          </Link>
          <Link
            href="mailto:spratham388@gmail.com"
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors"
            aria-label="Email"
          >
            <Mail className="h-5 w-5" />
          </Link>
          <span className="hidden sm:inline text-primary-foreground/70">|</span>{" "}
          {/* Separator */}
          {/* Policy Links - Use text-primary-foreground for hover on gradient */}
          <Link
            href="/privacy-policy"
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-primary-foreground/90 hover:text-primary-foreground transition-colors"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
