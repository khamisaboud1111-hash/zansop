"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  HelpCircle,
  Briefcase,
  ShoppingCart,
  User,
  AlertCircle,
} from "lucide-react";
import { useLangStore } from "@/store";
import { t, type Language } from "@/i18n/translations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

function makeSchema(lang: Language) {
  return z.object({
    name: z.string().min(2, t("nameRequired", lang)),
    email: z.string().email(t("invalidEmail", lang)),
    phone: z.string().optional(),
    subject: z.string().min(1, t("selectOption", lang)),
    message: z.string().min(10, "Message must be at least 10 characters"),
  });
}

type FormData = z.infer<ReturnType<typeof makeSchema>>;

const container = {
  hidden: { opacity: 0 },
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const contactMethods = [
  {
    icon: Phone,
    title: "contactPhoneTitle",
    desc: "contactPhoneDesc",
    value: "0719488073",
    color: "from-emerald-500 to-teal-400",
  },
  {
    icon: Mail,
    title: "contactEmailTitle",
    desc: "contactEmailDesc",
    value: "info@zanshop.co.tz",
    color: "from-brand-500 to-teal-400",
  },
  {
    icon: MapPin,
    title: "contactLocationTitle",
    desc: "contactLocationDesc",
    value: "Zanzibar, Tanzania",
    color: "from-purple-500 to-pink-400",
  },
];

const departments = [
  {
    icon: MessageCircle,
    key: "contactGeneral",
    value: "general",
  },
  {
    icon: ShoppingCart,
    key: "contactCustomerSupport",
    value: "support",
  },
  {
    icon: Briefcase,
    key: "contactPartnership",
    value: "partnership",
  },
  {
    icon: ShoppingCart,
    key: "contactSales",
    value: "sales",
  },
];

export default function ContactPage() {
  const { lang } = useLangStore();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(makeSchema(lang)),
    defaultValues: { subject: "general" },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(t("contactSuccess", lang));
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <motion.main
      className="min-h-screen pb-20 sm:pb-8"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <div className="page-container py-8 sm:py-12">
        {/* Hero */}
        <motion.section variants={item} className="text-center mb-12 sm:mb-16">
          <motion.span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{t("contact", lang)}</span>
          </motion.span>

          <motion.h1
            className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-ink-900 dark:text-white leading-tight mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {t("contactTitle", lang)}
          </motion.h1>

          <motion.p
            className="text-ink-500 dark:text-ink-300 text-sm sm:text-base max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t("contactSubtitle", lang)}
          </motion.p>
        </motion.section>

        {/* Contact Methods */}
        <motion.section variants={item} className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {contactMethods.map((method, i) => (
              <motion.div
                key={i}
                className="card p-5 text-center group"
                whileHover={{ y: -4 }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}
                >
                  <method.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white mb-1">
                  {t(method.title as any, lang)}
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400 mb-2">
                  {t(method.desc as any, lang)}
                </p>
                <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
                  {t("officeHours", lang)}
                </p>
                <p className="text-sm text-ink-600 dark:text-ink-300 break-all">
                  {method.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact Form */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12"
        >
          {/* Form */}
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white mb-6">
              {t("contactSendMessage", lang)}
            </h2>

            {success && (
              <motion.div
                className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-sm font-semibold">{t("contactSuccess", lang)}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                    {t("contactName", lang)}
                  </label>
                  <Input
                    {...register("name")}
                    placeholder={t("fullName", lang)}
                    error={errors.name?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                    {t("contactEmail", lang)}
                  </label>
                  <Input
                    type="email"
                    {...register("email")}
                    placeholder={t("emailPlaceholder", lang)}
                    error={errors.email?.message}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                  {t("contactPhone", lang)}
                </label>
                <Input
                  type="tel"
                  {...register("phone")}
                  placeholder="+255..."
                  error={errors.phone?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                  {t("contactSubject", lang)}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {departments.map((dept) => (
                    <motion.label
                      key={dept.value}
                      className="flex items-center gap-2 p-3 rounded-xl border border-ink-200 dark:border-ink-700 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-500/10 has-[:checked]:border-brand-500"
                    >
                      <input
                        type="radio"
                        value={dept.value}
                        {...register("subject")}
                        className="sr-only"
                      />
                      <dept.icon className="w-4 h-4 text-ink-600 dark:text-ink-300" />
                      <span className="text-xs font-medium text-ink-700 dark:text-ink-200">
                        {t(dept.key as any, lang)}
                      </span>
                    </motion.label>
                  ))}
                </div>
                {errors.subject && (
                  <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">
                  {t("contactMessage", lang)}
                </label>
                <textarea
                  {...register("message")}
                  rows={5}
                  placeholder={t("typeMessage", lang)}
                  className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none text-sm"
                />
                {errors.message && (
                  <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
                )}
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitting}
                className="w-full px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("contactSending", lang)}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t("contactSendMessage", lang)}
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Map */}
          <div className="lg:col-span-1">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white mb-6">
              {t("contactMapTitle", lang)}
            </h2>
            <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-brand-200 to-amber-200 dark:from-brand-900/30 dark:to-amber-900/30 border border-white/20 dark:border-white/5 h-64">
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </motion.main>
  );
}


