
import Link from 'next/link';
import { Linkedin, Instagram, Mail } from 'lucide-react'; // Import icons

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    // Apply solid background color and adjust text color
    <footer className="border-t bg-orange-600 text-primary-foreground">
      <div className="container flex flex-col items-center justify-center gap-4 py-8 text-sm md:flex-row md:justify-between px-4 md:px-6">
        {/* Use text-primary-foreground for better contrast on gradient */}
        <p className="text-center md:text-left text-primary-foreground/90">&copy; {currentYear} LADDU ZABARDAST. All rights reserved.</p>
        <nav className="flex gap-4 items-center">
           {/* Social Links - Use text-primary-foreground for hover on gradient */}
           <Link href="https://www.linkedin.com/in/laddu-zabardast-neetu-singh-a293622a7/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors" aria-label="LinkedIn">
             <Linkedin className="h-5 w-5" />
           </Link>
           <Link href="https://www.instagram.com/laddu_zabardast/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors" aria-label="Instagram">
             <Instagram className="h-5 w-5" />
           </Link>
           <Link href="mailto:spratham388@gmail.com" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors" aria-label="Email">
             <Mail className="h-5 w-5" />
           </Link>
           <span className="hidden sm:inline text-primary-foreground/70">|</span> {/* Separator */}
          {/* Policy Links - Use text-primary-foreground for hover on gradient */}
          <Link href="/privacy-policy" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms-of-service" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">Terms of Service</Link>
        </nav>
      </div>
    </footer>
  );
}
