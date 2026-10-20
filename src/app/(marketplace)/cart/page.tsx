"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Package } from "lucide-react";
import { useCartStore, useLangStore, selectCartSubtotal, selectCartItemCount, selectCartTotalSavings } from "@/store";
import { formatTZS, cn } from "@/utils";
import { t } from "@/i18n/translations";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";

const container = {
  hidden: { opacity: 0 },
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function CartPage() {
  const router = useRouter();
  const { lang } = useLangStore();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore(selectCartSubtotal);
  const itemCount = useCartStore(selectCartItemCount);
  const totalSavings = useCartStore(selectCartTotalSavings);

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="page-container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto space-y-5"
        >
          <div className="w-24 h-24 rounded-full bg-ink-50 dark:bg-ink-800 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-10 h-10 text-ink-300 dark:text-ink-400" />
          </div>
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white">
            {t("emptyCart", lang)}
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {t("emptyCartDesc", lang)}
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-95"
          >
            {t("startShopping", lang)}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.main
      className="pb-20 sm:pb-8"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <div className="page-container py-4 sm:py-6">
        <motion.h1
          variants={item}
          className="font-display font-black text-2xl text-ink-900 dark:text-white mb-6"
        >
          {t("cart", lang)} ({itemCount})
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div variants={item}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-ink-800 dark:text-ink-200">
                  {t("cartItems", lang)}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={clearCart}
                  className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 font-medium hover:underline"
                >
                  {t("clearCart", lang)}
                </motion.button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {items.map(({ product, quantity }) => {
                    // Defensive: ensure product has required fields
                    if (!product || !product.id || !product.name) return null;
                    
                    const img = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
                    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
                    const itemTotal = (product.price ?? 0) * quantity;

                    return (
                      <motion.div
                        key={product.id}
                        variants={item}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="card p-4 flex gap-3 group"
                      >
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                          {img?.url ? (
                            <Image
                              src={img.url}
                              alt={product.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <Package className="absolute inset-0 m-auto w-6 h-6 text-ink-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="font-semibold text-sm text-ink-900 dark:text-white line-clamp-1">
                            {product.name}
                          </p>
                          <p className="text-xs text-ink-400">
                            {product.seller?.store_name || product.seller_id || ""}
                          </p>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-ink-100 dark:bg-ink-800 rounded-xl p-1">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-background transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <span className="text-xs font-bold text-ink-900 dark:text-white w-5 text-center">
                                {quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-600 dark:text-ink-300 hover:bg-background transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {hasDiscount && (
                                <span className="text-xs text-ink-400 line-through">
                                  {formatTZS((product.compare_at_price ?? 0) * quantity)}
                                </span>
                              )}
                              <span className="font-bold text-sm text-ink-900 dark:text-white">
                                {formatTZS(itemTotal)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeItem(product.id)}
                          className="w-7 h-7 rounded-xl bg-ink-100 dark:bg-ink-800 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div variants={item} className="lg:sticky lg:top-20 lg:h-fit">
            <div className="card p-5 space-y-4">
              <h2 className="font-display font-bold text-lg text-ink-900 dark:text-white">
                {t("orderSummary", lang)}
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-ink-600 dark:text-ink-300">
                  <span>{t("subtotal", lang)}</span>
                  <span className="font-medium text-ink-900 dark:text-white">
                    {formatTZS(subtotal)}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-ink-600 dark:text-ink-300">
                    <span>{t("discount", lang)}</span>
                    <span className="font-medium text-emerald-600">
                      -{formatTZS(totalSavings)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-ink-600 dark:text-ink-300">
                  <span>{t("deliveryFee", lang)}</span>
                  <span className="font-medium">
                    {deliveryFee > 0 ? formatTZS(deliveryFee) : "—"}
                  </span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-600 dark:text-ink-300">
                  {t("total", lang)}
                </span>
                <span className="font-display font-black text-xl text-brand-600 dark:text-brand-400">
                  {formatTZS(total)}
                </span>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleCheckout}
                  variant="primary"
                  size="lg"
                  className="w-full justify-center py-3 text-base font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
                >
                  {t("checkout", lang)}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>

              <p className="text-xs text-center text-ink-500 dark:text-ink-400">
                {t("freeShippingNote", lang)}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
}

