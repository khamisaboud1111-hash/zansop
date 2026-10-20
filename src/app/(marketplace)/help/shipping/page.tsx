"use client";

import LText from "@/components/shared/LText";

export default function ShippingPolicyPage() {
  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-8 sm:py-12 max-w-3xl">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 dark:text-white mb-2">
          <LText k="shippingPolicy" />
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mb-8">
          <LText k="lastUpdated" /> <span className="font-medium">2024-01-15</span>
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="shippingGeneral" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="shippingGeneralDesc1" />
            </p>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="shippingGeneralDesc2" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="shippingDeliveryTimes" />
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-ink-900 dark:text-white">
                      <LText k="region" />
                    </th>
                    <th className="text-left p-3 font-semibold text-ink-900 dark:text-white">
                      <LText k="deliveryTime" />
                    </th>
                    <th className="text-left p-3 font-semibold text-ink-900 dark:text-white">
                      <LText k="cost" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="p-3 text-ink-700 dark:text-ink-300"><LText k="stoneTown" /></td>
                    <td className="p-3 text-ink-700 dark:text-ink-300"><LText k="sameDay" /></td>
                    <td className="p-3 text-ink-700 dark:text-ink-300">TZS 2,000</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 text-ink-700 dark:text-ink-300"><LText k="westUnguja" /></td>
                    <td className="p-3 text-ink-700 dark:text-ink-300"><LText k="oneTwoDays" /></td>
                    <td className="p-3 text-ink-700 dark:text-ink-300">TZS 3,500</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 text-ink-700 dark:text-ink-300"><LText k="eastUnguja" /></td>
                    <td className="p-3 text-ink-700 dark:text-ink-300"><LText k="oneTwoDays" /></td>
                    <td className="p-3 text-ink-700 dark:text-ink-300">TZS 3,500</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-3 text-ink-700 dark:text-ink-300"><LText k="pemba" /></td>
                    <td className="p-3 text-ink-700 dark:text-ink-300"><LText k="twoThreeDays" /></td>
                    <td className="p-3 text-ink-700 dark:text-ink-300">TZS 5,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="shippingFreeThreshold" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="freeShippingDesc" />
            </p>
            <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl">
              <p className="font-semibold text-brand-700 dark:text-brand-300 mb-2">
                <LText k="freeShippingNote" />
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="shippingTracking" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="trackingDesc1" />
            </p>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              <LText k="trackingDesc2" />
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="shippingIssues" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="issuesDesc1" />
            </p>
            <ul className="list-disc list-inside space-y-2 text-ink-600 dark:text-ink-300">
              <li><LText k="issueLate" /></li>
              <li><LText k="issueDamaged" /></li>
              <li><LText k="issueMissing" /></li>
              <li><LText k="issueWrongItem" /></li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-4">
              <LText k="shippingContact" />
            </h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed mb-4">
              <LText k="contactDesc" />
            </p>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> support@zanshop.co.tz</p>
              <p><span className="font-medium">Phone/WhatsApp:</span> 0719 488 073</p>
              <p><span className="font-medium">Hours:</span> Mon-Sat 8am-6pm EAT</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

