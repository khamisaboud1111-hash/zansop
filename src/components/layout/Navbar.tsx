'use client';

import React, { useEffect, useMemo, useRef, useState, Component } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  User,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  Store,
  Package,
  MessageSquare,
  ShieldCheck,
  LogOut,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useUiStore, useLangStore, useThemeStore, useCartStore } from "@/store";
import { t } from "@/i18n/translations";
import { useNotifications } from "@/hooks/useNotifications";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { formatTZS, cn } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface Category {
  id: string | number;
  name: string;
  slug?: string;
  [key: string]: any;
}

interface NavbarProps {
  categories?: Category[];
}

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  price: number;
  image?: { url: string; is_primary?: boolean } | null;
}

export default function Navbar({ categories = [] }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navError, setNavError] = useState<Error | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const lang = useLangStore((s) => s.lang);
  const theme = useThemeStore((s) => s.theme);
  const hasHydrated = useThemeStore((s) => s.hasHydrated);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { unreadCount } = useNotifications();
  const { profile, isAdmin, isSeller } = useUser();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll detection for glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
}, []);
 
  // Debounced search suggestions (only after mount to avoid hydration issues)
  useEffect(() => {
    if (!mounted) return;
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setSuggesting(false);
      setSuggestionsOpen(false);
      return;
    }
    setSuggesting(true);
    const handle = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, slug, name, price, images:product_images(url, is_primary)")
          .eq("status", "active")
          .ilike("name", `%${q}%`)
          .order("created_at", { ascending: false })
          .limit(6);
        if (!error) setSuggestions((data ?? []) as Suggestion[]);
      } catch (err) {
        console.error('Search suggestions error:', err);
        setNavError(err instanceof Error ? err : new Error('Search failed'));
      } finally {
        setSuggesting(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery, supabase, mounted]);

  // Close suggestions on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestionsOpen(false);
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const primaryImage = (p: Suggestion) => p.image?.url ?? "";

  const themeIcon =
    hasHydrated && theme === "dark" ? (
      <Sun className="w-[18px] h-[18px]" />
    ) : (
      <Moon className="w-[18px] h-[18px]" />
    );

  const iconBtn =
    "p-2.5 rounded-2xl hover:bg-white/20 dark:hover:bg-white/10 text-ink-800 dark:text-white relative transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

  // Error fallback UI
  if (navError) {
    return (
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-ink-900/80 backdrop-blur-2xl border-b border-white/20 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-400 to-amber-400 flex items-center justify-center">
                <span className="text-white font-black text-sm tracking-tight">DJ</span>
              </div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 bg-clip-text text-transparent">
                Zanshop
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300 max-w-xs truncate">
              {t('navbarError', lang) || 'Navbar temporarily unavailable'}
            </span>
            <button
              onClick={() => setNavError(null)}
              className="ml-2 text-xs text-red-500 hover:underline"
            >
              {t('retry', lang)}
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-white/80 dark:bg-ink-900/80 backdrop-blur-2xl border-b border-white/20 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
          : "bg-white/60 dark:bg-ink-900/60 backdrop-blur-xl border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-ink-900 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
              aria-label={t("toggleMenu", lang)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" className="flex flex-col items-center gap-0.5 group">
              <Image src="/zanshop-logo.svg" alt="Zanshop" width={32} height={32} className="mx-auto" priority />
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 bg-clip-text text-transparent">
                Zanshop
              </span>
              <span className="text-brand-600 dark:text-brand-400 font-semibold text-[10px] tracking-wide mx-auto">
                Buy and seller made easy
              </span>
            </Link>
          </div>

          {/* Search Bar with live suggestions */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <form onSubmit={handleSearch} className="relative w-full group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/20 to-amber-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
              <div className="relative flex items-center bg-ink-100/60 dark:bg-ink-800/60 border border-ink-200/60 dark:border-ink-700/60 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500/50 transition-all duration-300">
                <Search className="absolute left-4 w-4 h-4 text-ink-400 dark:text-ink-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setSuggestionsOpen(true)}
                  placeholder={t("searchPlaceholder", lang)}
                  aria-label={t("searchPlaceholder", lang)}
                  className="w-full bg-transparent py-3 pl-12 pr-24 text-sm focus:outline-none placeholder:text-ink-400 dark:placeholder:text-ink-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-1.5 rounded-xl text-xs font-semibold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-95"
                >
                  {t("searchButton", lang)}
                </button>
              </div>
            </form>

            <AnimatePresence>
              {suggestionsOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute top-full left-0 right-0 mt-3 rounded-3xl border border-white/20 dark:border-white/10 bg-white/90 dark:bg-ink-900/90 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-ink-400 dark:text-ink-500">
                    {t("products", lang)}
                  </div>
                  {suggesting ? (
                    <div className="px-5 py-8 text-sm text-ink-400 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      {t("searching", lang)}
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-ink-400">{t("noResults", lang)}</div>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto">
                      {suggestions.map((p, i) => (
                        <motion.li
                          key={p.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Link
                            href={`/products/${p.slug}`}
                            onClick={() => setSuggestionsOpen(false)}
                            className="flex items-center gap-4 px-5 py-3 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors group/item"
                          >
                            {primaryImage(p) ? (
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-ink-100 dark:bg-ink-800 flex-shrink-0">
                                <Image
                                  src={primaryImage(p)}
                                  alt=""
                                  fill
                                  sizes="48px"
                                  className="object-cover group-hover/item:scale-110 transition-transform duration-300"
                                />
                              </div>
                            ) : (
                              <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-amber-100 dark:from-brand-900/30 dark:to-amber-900/30 flex items-center justify-center text-lg flex-shrink-0">
                                ðŸ“¦
                              </span>
                            )}
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-ink-900 dark:text-white truncate">{p.name}</span>
                              <span className="text-xs text-ink-400">{t("view", lang)}</span>
                            </span>
                            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{formatTZS(p.price)}</span>
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setSuggestionsOpen(false)}
                    className="flex items-center justify-between border-t border-ink-100 dark:border-ink-800 px-5 py-3 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors"
                  >
                    {t("seeAll", lang)}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/wishlist" className={cn(iconBtn, "hidden sm:flex")} aria-label={t("wishlist", lang)}>
              <Heart className="w-[18px] h-[18px]" />
            </Link>

            <Link href="/checkout" className={cn(iconBtn, "relative")} aria-label={t("cart", lang)}>
              <ShoppingCart className="w-[18px] h-[18px]" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-brand-500/30"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link href="/notifications" className={cn(iconBtn, "hidden sm:flex")} aria-label={t("notifications", lang)}>
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <button onClick={toggleTheme} className={iconBtn} aria-label={t("theme", lang)} title={t("theme", lang)}>
              {themeIcon}
            </button>

            {/* Account dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-2xl hover:bg-white/20 dark:hover:bg-white/10 border border-ink-200/50 dark:border-ink-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-all" aria-label={t("account", lang)}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden lg:inline text-xs font-semibold text-ink-700 dark:text-ink-200">{t("account", lang)}</span>
                <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-ink-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border-white/20 dark:border-white/10 bg-white/90 dark:bg-ink-900/90 backdrop-blur-2xl shadow-2xl p-2">
                {profile ? (
                  <>
                    <DropdownMenuLabel className="px-3 py-2">
                      <span className="block text-sm font-bold text-ink-900 dark:text-white">{profile.full_name || profile.email || t("account", lang)}</span>
                      <span className="block text-xs font-medium text-ink-400 capitalize mt-0.5">{profile.role}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-ink-100 dark:bg-ink-800 my-1" />
                    {isSeller && (
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                        <Link href="/seller/dashboard" className="flex items-center gap-3">
                          <Store className="w-4 h-4 text-brand-500" /> {t("sellerDashboard", lang)}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {profile.role === "rider" && (
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                        <Link href="/rider/dashboard" className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-brand-500" /> {t("riderDashboard", lang)}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                        <Link href="/admin/dashboard" className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-brand-500" /> {t("adminDashboard", lang)}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                      <Link href="/orders" className="flex items-center gap-3">
                        <ShoppingCart className="w-4 h-4 text-brand-500" /> {t("orders", lang)}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                      <Link href="/messages" className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-brand-500" /> {t("messages", lang)}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-ink-100 dark:bg-ink-800 my-1" />
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                      <Link href="/settings" className="flex items-center gap-3">
                        <User className="w-4 h-4 text-brand-500" /> {t("profile", lang)}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={async (e) => {
                        e.preventDefault();
                        await supabase.auth.signOut();
                        router.push("/login");
                      }}
                      className="rounded-xl px-3 py-2.5 focus:bg-red-50 dark:focus:bg-red-500/10 text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4 mr-3" /> {t("logout", lang)}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                      <Link href="/login" className="flex items-center gap-3">
                        <User className="w-4 h-4 text-brand-500" /> {t("login", lang)}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                      <Link href="/register" className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-brand-500" /> {t("register", lang)}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category row (desktop) */}
        {categories.length > 0 && (
          <div className="hidden lg:flex items-center gap-1 px-8 py-2.5 border-t border-ink-200/30 dark:border-ink-700/30 bg-ink-50/30 dark:bg-ink-800/20 text-xs overflow-x-auto scrollbar-hide">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 font-bold text-ink-700 dark:text-ink-200 hover:text-brand-600 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl px-3 py-1.5 hover:bg-white/50 dark:hover:bg-white/5 transition-all" aria-label={t("categories", lang)}>
                {t("categories", lang)}
                <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-2xl border-white/20 dark:border-white/10 bg-white/90 dark:bg-ink-900/90 backdrop-blur-2xl shadow-2xl p-2">
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                  <Link href="/search">{t("allProducts", lang)}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-ink-100 dark:bg-ink-800 my-1" />
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat.id} asChild className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-brand-500/10">
                    <Link href={`/category/${cat.slug || cat.id}`}>{cat.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug || cat.id}`}
                className="px-3 py-1.5 rounded-xl text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all whitespace-nowrap font-medium"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}


