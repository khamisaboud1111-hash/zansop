import Link from "next/link";
import { MapPin, Mail, Send } from "lucide-react";

export default function Footer() {
  const socialLinks = [
    { icon: "📘", href: "https://facebook.com/zanshop", label: "Facebook" },
    { icon: "📷", href: "https://instagram.com/zanshop", label: "Instagram" },
    { icon: "🐦", href: "https://twitter.com/zanshop", label: "Twitter" },
    { icon: "💼", href: "https://linkedin.com/company/zanshop", label: "LinkedIn" },
  ];

  const footerLinks = [
    {
      title: "Buying",
      links: [
        { label: "All Products", href: "/search" },
        { label: "Made in Zanzibar", href: "/search?made_in_zanzibar=true" },
        { label: "Orders", href: "/orders" },
        { label: "Wishlist", href: "/wishlist" },
      ],
    },
    {
      title: "Selling",
      links: [
        { label: "Open a Store", href: "/register?type=seller" },
        { label: "Seller Dashboard", href: "/seller/dashboard" },
        { label: "Seller Help", href: "/help/seller" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "Shipping Policy", href: "/help/shipping" },
        { label: "Return Policy", href: "/help/returns" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-950 mt-16">
      <div className="page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-400 to-amber-400 flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">DJ</span>
              </div>
              <span className="font-display font-black text-xl text-ink-900 dark:text-white">Zanshop</span>
            </div>
            <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs">
              Your trusted marketplace in Zanzibar
            </p>

            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-600 transition-all hover:-translate-y-0.5"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-xl">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm text-ink-900 dark:text-white tracking-wider uppercase">
                Buying
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/search" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">All Products</Link></li>
                <li><Link href="/search?made_in_zanzibar=true" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Made in Zanzibar</Link></li>
                <li><Link href="/orders" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">My Orders</Link></li>
                <li><Link href="/wishlist" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Wishlist</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm text-ink-900 dark:text-white tracking-wider uppercase">
                Selling
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/register?type=seller" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Open a Store</Link></li>
                <li><Link href="/seller/dashboard" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Seller Dashboard</Link></li>
                <li><Link href="/help/seller" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Seller Help</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm text-ink-900 dark:text-white tracking-wider uppercase">
                Support
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/contact" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/help/shipping" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Shipping Policy</Link></li>
                <li><Link href="/help/returns" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Return Policy</Link></li>
                <li><Link href="/privacy" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-1 space-y-4">
              <h4 className="font-display font-bold text-sm text-ink-900 dark:text-white tracking-wider uppercase">
                Contact Info
              </h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <span className="text-ink-600 dark:text-ink-300">Zanzibar, Tanzania</span>
                </div>
                <div className="flex items-start gap-3">
                  <Send className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <span className="text-ink-600 dark:text-ink-300">WhatsApp: 0719488073</span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                  <span className="text-ink-600 dark:text-ink-300">info@zanshop.co.tz</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-200 dark:border-ink-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-ink-500 dark:text-ink-400">
          <span>
            &copy; {new Date().getFullYear()} Zanshop. All rights reserved.
          </span>
          <span className="sm:text-right">Zanzibar, Tanzania</span>
        </div>
      </div>
    </footer>
  );
}

