'use client'

import SellerWalletPanel from '@/components/seller/SellerWalletPanel'
import LText from '@/components/shared/LText'
import { Wallet } from 'lucide-react'

export default function SellerWalletPage() {
  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-500" />
            <LText k="myWallet" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <LText k="walletHint" />
          </p>
        </div>

        <SellerWalletPanel />
      </div>
    </main>
  )
}
