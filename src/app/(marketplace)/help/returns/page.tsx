"use client";

import LText from "@/components/shared/LText";

export default function ReturnsPolicyPage() {
  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-8 sm:py-12 max-w-3xl">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 dark:text-white mb-2">
          <LText k="returnPolicy" />
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mb-8">
          <LText k="lastUpdated" /> <span className="font-medium">2024-01-15</span>
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="returnsGeneral" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="returnsGeneralDesc1" />
            </p>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="returnsGeneralDesc2" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="returnsEligibility" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="eligibilityDesc1" />
            </p>
            <ul className="list-disc list-inside space-y-2 text-ink-600 dark:text-ink-300 mb-4">
              <li><LText k="eligibleNew" /></li>
              <li><LText k="eligibleDamaged" /></li>
              <li><LText k="eligibleWrongItem" /></li>
              <li><LText k="eligibleDefective" /></li>
            </ul>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="nonEligibleNote" />
            </p>
            <ul className="list-disc list-inside space-y-2 text-ink-600 dark:text-ink-300">
              <li><LText k="nonEligibleUsed" /></li>
              <li><LText k="nonEligiblePersonalized" /></li>
              <li><LText k="nonEligiblePerishable" /></li>
              <li><LText k="nonEligibleDigital" /></li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="returnsTimeframe" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="timeframeDesc" />
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl mb-4">
              <p className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
                <LText k="importantNote" />
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                <LText k="timeframeNote" />
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="returnsProcess" />
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-brand-600 dark:text-brand-400">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-1"><LText k="step1" /></h3>
                  <p className="text-ink-600 dark:text-ink-300"><LText k="step1Desc" /></p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-brand-600 dark:text-brand-400">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-1"><LText k="step2" /></h3>
                  <p className="text-ink-600 dark:text-ink-300"><LText k="step2Desc" /></p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-brand-600 dark:text-brand-400">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-1"><LText k="step3" /></h3>
                  <p className="text-ink-600 dark:text-ink-300"><LText k="step3Desc" /></p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-brand-600 dark:text-brand-400">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-1"><LText k="step4" /></h3>
                  <p className="text-ink-600 dark:text-ink-300"><LText k="step4Desc" /></p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="returnsRefund" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="refundDesc1" />
            </p>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="refundDesc2" />
            </p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                <LText k="refundNote" />
              </p>
              <p className="text-emerald-700 dark:text-emerald-300"><LText k="refundTimeframe" /></p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="returnsShipping" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="shippingDesc1" />
            </p>
            <ul className="list-disc list-inside space-y-2 text-ink-600 dark:text-ink-300 mb-4">
              <li><LText k="shippingSellerFault" /></li>
              <li><LText k="shippingBuyerFault" /></li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="returnsContact" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="returnsContactDesc" />
            </p>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> returns@zanshop.co.tz</p>
              <p><span className="font-medium">Phone/WhatsApp:</span> 0719 488 073</p>
              <p><span className="font-medium">Hours:</span> Mon-Sat 8am-6pm EAT</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

