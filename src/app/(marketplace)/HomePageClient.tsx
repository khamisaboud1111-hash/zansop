'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/types'
import type { HomeStats } from '@/components/home/HeroSection'
import { SectionErrorBoundary } from '@/components/shared/SectionErrorBoundary'
import MobileLanguageSelector from '@/components/layout/MobileLanguageSelector'
import Footer from '@/components/layout/Footer'
import { t, type Language } from '@/i18n/translations'
import HeroSection from '@/components/home/HeroSection'
import QuickActionsCard from '@/components/home/QuickActionsCard'
import TrustBadges from '@/components/home/TrustBadges'
import GetStartedSteps from '@/components/home/GetStartedSteps'
import FeaturedSellersShowcase from '@/components/home/FeaturedSellersShowcase'
import ShippingSteps from '@/components/home/ShippingSteps'
import CategoryGrid from '@/components/home/CategoryGrid'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import ReelsFeed from '@/components/reels/ReelsFeed'
import { FadeInView, StaggerGrid, StaggerItem } from '@/components/shared/FadeInView'
import ProductCard from '@/components/product/ProductCard'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { SkeletonGrid } from '@/components/shared/SkeletonComposites'

interface HomePageClientProps {
  stats: HomeStats
  featuredSellers: any[]
  recentProducts: Product[]
  categories: any[]
  testimonials: any[]
  lang: Language
}

export function HomePageClient({ stats, featuredSellers, recentProducts, categories, testimonials, lang }: HomePageClientProps) {
  return (
    <>
      <MobileLanguageSelector />
      <SectionErrorBoundary name="HeroSection" lang={lang}>
        <HeroSection stats={stats} />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="QuickActionsCard" lang={lang}>
        <QuickActionsCard />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="TrustBadges" lang={lang}>
        <FadeInView>
          <TrustBadges />
        </FadeInView>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="GetStartedSteps" lang={lang}>
        <GetStartedSteps />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="CategoryGrid" lang={lang}>
        <CategoryGrid categories={categories} />
      </SectionErrorBoundary>

      {recentProducts.length > 0 && (
        <SectionErrorBoundary name="NewProducts" lang={lang}>
          <FadeInView>
            <Suspense fallback={
              <div className="section"><SkeletonGrid count={4} className="grid-cols-2 sm:grid-cols-4" /></div>
            }>
              <section className="section">
                <div className="page-container">
                  <SectionHeading
                    title={t("newProducts", lang)}
                    action={
                      <Link href="/search?sort=newest" className="text-sm font-semibold text-brand-600 dark:text-brand-300 whitespace-nowrap hover:underline">
                        {t("seeAll", lang)} →
                      </Link>
                    }
                    className="mb-4"
                  />
                  <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {recentProducts.slice(0, 4).map((product) => (
                      <StaggerItem key={product.id}>
                        <ProductCard product={product} />
                      </StaggerItem>
                    ))}
                  </StaggerGrid>
                </div>
              </section>
            </Suspense>
          </FadeInView>
        </SectionErrorBoundary>
      )}

      <SectionErrorBoundary name="FeaturedSellersShowcase" lang={lang}>
        <FadeInView>
          <Suspense fallback={<div className="h-64 w-full rounded-2xl bg-muted animate-pulse" />}>
            <FeaturedSellersShowcase sellers={featuredSellers} />
          </Suspense>
        </FadeInView>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="ShippingSteps" lang={lang}>
        <FadeInView>
          <section className="section">
            <div className="page-container">
              <ShippingSteps />
            </div>
          </section>
        </FadeInView>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="TestimonialsSection" lang={lang}>
        <TestimonialsSection testimonials={testimonials} />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="ReelsFeed" lang={lang}>
        <ReelsFeed lang={lang} />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="BottomCTA" lang={lang}>
        <section className="relative isolate overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 py-14 sm:py-16 animate-gradient-pan">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 animate-pulse-glow" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/10 animate-pulse-glow" style={{ animationDelay: '2s' }} />
          <div className="page-container relative text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-[11px] font-bold tracking-wide uppercase mb-4">
              {t("limitedTimeOffer", lang)}
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-2">
              {t("bottomCtaTitleV2", lang)}
            </h2>
            <p className="text-white/85 text-sm sm:text-base mb-6 max-w-md mx-auto">
              {t("bottomCtaSubtitleV2", lang)}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl text-sm hover:bg-brand-50 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95">
                {t("gs1Cta", lang)}
              </Link>
              <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 text-white font-semibold rounded-xl text-sm hover:bg-white/25 transition-all border border-white/30 hover:-translate-y-0.5 active:scale-95">
                {t("browse", lang)}
              </Link>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>
      <Footer />
    </>
  )
}
