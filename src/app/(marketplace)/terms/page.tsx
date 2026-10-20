"use client";

import LText from "@/components/shared/LText";

export default function TermsPage() {
  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-8 sm:py-12 max-w-3xl">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 dark:text-white mb-8">
          <LText k="termsOfService" />
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mb-8">
          <LText k="lastUpdated" /> <span className="font-medium">2024-01-15</span>
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="terms1" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="terms1Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="terms2" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="terms2Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="terms3" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="terms3Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="terms4" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="terms4Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="terms5" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="terms5Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="terms6" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="terms6Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="terms7" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="terms7Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="terms8" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="terms8Desc" />
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

