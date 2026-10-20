"use client";

import Link from "next/link";
import { Shield, LifeBuoy, BookOpen, Mail, Phone, MessageCircle } from "lucide-react";
import { useLangStore } from "@/store";
import { t, type Language } from "@/i18n/translations";
import LText from "@/components/shared/LText";

const helpSections = [
  {
    icon: BookOpen,
    title: "gettingStarted",
    description: "gettingStartedDesc",
    items: [
      { label: "createAccount", href: "/register" },
      { label: "verifyEmail", href: "/verify-email" },
      { label: "completeProfile", href: "/settings" },
    ],
  },
  {
    icon: LifeBuoy,
    title: "sellingHelp",
    description: "sellingHelpDesc",
    items: [
      { label: "listProducts", href: "/seller/products/new" },
      { label: "manageOrders", href: "/seller/orders" },
      { label: "payouts", href: "/seller/wallet" },
    ],
  },
  {
    icon: Shield,
    title: "verificationHelp",
    description: "verificationHelpDesc",
    items: [
      { label: "whyVerify", href: "/seller/verification" },
      { label: "requiredDocuments", href: "/help/verification/documents" },
      { label: "verificationStatus", href: "/seller/verification" },
    ],
  },
  {
    icon: MessageCircle,
    title: "contactSupport",
    description: "contactSupportDesc",
    items: [
      { label: "emailUs", href: "/contact" },
      { label: "callUs", href: "tel:+255719488073" },
      { label: "chatSupport", href: "/messages/support" },
    ],
  },
];

export default function SellerHelpPage() {
  const { lang } = useLangStore();

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-8 sm:py-12">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 dark:text-white mb-2">
          <LText k="sellerHelp" />
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mb-10 max-w-2xl">
          <LText k="sellerHelpSubtitle" />
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {helpSections.map((section, i) => (
            <Link
              key={section.title}
              href={section.items[0]?.href}
              className="card p-6 group hover:shadow-card-hover transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <section.icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-bold text-lg text-ink-900 dark:text-white mb-2">
                <LText k={section.title} />
              </h3>
              <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
                <LText k={section.description} />
              </p>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <span className="text-xs text-brand-600 dark:text-brand-400 hover:underline cursor-pointer">
                      <LText k={item.label} />
                    </span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-brand-50 dark:bg-brand-900/20 rounded-2xl">
          <h2 className="font-display font-bold text-xl mb-4 text-center">
            <LText k="stillNeedHelp" />
          </h2>
          <p className="text-center text-ink-500 dark:text-ink-400 mb-6">
            <LText k="stillNeedHelpDesc" />
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-all"
            >
              <Mail className="w-4 h-4" />
              <LText k="emailSupport" />
            </Link>
            <a
              href="tel:+255719488073"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-500 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition-all"
            >
              <Phone className="w-4 h-4" />
              <LText k="callSupport" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

