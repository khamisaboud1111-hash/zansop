"use client";

import LText from "@/components/shared/LText";

export default function PrivacyPage() {
  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-8 sm:py-12 max-w-3xl">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 dark:text-white mb-8">
          <LText k="privacyPolicy" />
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mb-8">
          <LText k="lastUpdated" /> <span className="font-medium">2024-01-15</span>
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="privacy1" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="privacy1Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="privacy2" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="privacy2Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="privacy3" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="privacy3Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="privacy4" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="privacy4Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="privacy5" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="privacy5Desc" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="privacy6" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="privacy6Desc" />
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

