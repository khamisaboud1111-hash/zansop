"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles, 
  Wand2, 
  Copy, 
  Check, 
  Upload, 
  Globe, 
  Tag, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Sliders,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  Loader2 // <-- Added Loader2 here to fix the build error
} from "lucide-react";
import Image from "next/image";

export type ToneOption = "professional" | "luxury" | "friendly" | "local" | "youth";
export type LanguageOption = "en" | "sw" | "both";

interface AIListing {
  titleEn: string;
  titleSw: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
  bulletFeatures: string[];
  keywords: string[];
  hashtags: string[];
  suggestedPriceTZS: {
    avgMarket: number;
    recommended: number;
    premium: number;
  };
  targetCustomer: string;
  recommendedCategory: string;
  shippingWeight: string;
  careInstructions: string;
  faqs: { question: string; answer: string }[];
  completenessScore: number;
}

export default function AIProductStudio() {
  const [rawTitle, setRawTitle] = useState("");
  const [tone, setTone] = useState<ToneOption>("professional");
  const [language, setLanguage] = useState<LanguageOption>("both");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<AIListing | null>(null);
  
  // UI copy feedback states
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Upload Simulation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Auto-detect a raw title hint based on upload if input is empty
        if (!rawTitle) {
          setRawTitle("Handcrafted Artisan Product");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTitle.trim()) {
      setError("Please enter a product idea or raw title to start generating.");
      return;
    }
    setError(null);
    setGenerating(true);

    // Simulated Smart Loading Progress
    const steps = [
      "Analyzing product attributes & image...",
      "Generating high-conversion SEO metadata...",
      "Writing bilingual descriptions (English & Swahili)...",
      "Calculating optimal market pricing (TZS)...",
      "Finalizing quality score & keywords..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(steps[i]);
      await new Promise((res) => setTimeout(res, 400));
    }

    // Mock AI Generation Engine Output
    setResult({
      titleEn: `${rawTitle} | Premium Quality Certified - Zanshop`,
      titleSw: `${rawTitle} | Ubora Uliothibitishwa - Zanshop`,
      shortDescription: `Experience superior craftsmanship with our ${rawTitle}. Sourced locally in Zanzibar and verified for durability and comfort.`,
      longDescription: `Elevate your lifestyle with our exceptional ${rawTitle}. Expertly crafted to withstand everyday use while maintaining a sleek, modern aesthetic. Perfect for customers looking for authentic East African quality, reliable daily performance, and unmatched elegance. Available for fast dispatch across Zanzibar, Dar es Salaam, and the wider region.`,
      seoTitle: `Buy Best ${rawTitle} Online in Zanzibar & Tanzania | Zanshop`,
      seoDescription: `Order authentic ${rawTitle} at the best price in Zanzibar. Fast delivery, secure mobile money checkout, and verified local quality.`,
      bulletFeatures: [
        "100% Genuine Certified Quality",
        "Handcrafted with precision for long-lasting durability",
        "Lightweight design optimized for everyday wear and comfort",
        "Sourced and verified directly from trusted East African artisans",
        "Eco-friendly and sustainable packaging"
      ],
      keywords: [rawTitle.toLowerCase(), "zanzibar marketplace", "Zanshop certified", "east africa shopping", "tanzania online store"],
      hashtags: ["#zanshop", "#ZanzibarShopping", "#BuyLocal", "#TanzaniaECommerce", "#QualityCertified"],
      suggestedPriceTZS: {
        avgMarket: 45000,
        recommended: 42000,
        premium: 55000
      },
      targetCustomer: "Style-conscious shoppers and local fashion enthusiasts across East Africa",
      recommendedCategory: "Fashion & Apparel > Footwear & Accessories",
      shippingWeight: "0.65 kg (Standard Parcel Box)",
      careInstructions: "Wipe clean with a soft dry cloth. Avoid prolonged exposure to direct moisture.",
      faqs: [
        { question: "Is this item available for delivery outside Zanzibar?", answer: "Yes, we ship securely across all regions of Tanzania and East Africa." },
        { question: "What payment methods are supported?", answer: "You can pay instantly using M-Pesa, Tigo Pesa, Airtel Money, or HaloPesa." }
      ],
      completenessScore: 94
    });

    setGenerating(false);
  };

  const handleCopySection = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tight">AI Seller Studio</h3>
          <p className="text-xs text-muted-foreground">Instantly generate complete, localized product listings for Zanshop</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-5">
        {/* Image Analysis Upload Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Product Image Analysis (Optional)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 p-4 rounded-2xl text-center cursor-pointer transition flex items-center justify-center gap-4"
          >
            {imagePreview ? (
              <div className="flex items-center gap-3">
                <Image src={imagePreview} alt="Upload preview" width={48} height={48} unoptimized className="w-12 h-12 object-cover rounded-xl border shadow-sm" />
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground">Image Loaded Successfully</p>
                  <p className="text-[10px] text-muted-foreground">AI will extract color, material, and category</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground">Click to upload product photo</p>
                  <p className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </div>
        </div>

        {/* Product Idea Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-muted-foreground">Product Idea / Raw Title</label>
            <span className="text-[10px] font-mono text-muted-foreground">{rawTitle.length} / 100</span>
          </div>
          <input
            type="text"
            value={rawTitle}
            onChange={(e) => setRawTitle(e.target.value)}
            placeholder="e.g., Handcrafted leather sandals"
            className="w-full bg-muted/40 border border-input rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Tone & Language Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Writing Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as ToneOption)}
              className="w-full bg-muted/40 border border-input rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="professional">Professional</option>
              <option value="luxury">Luxury & High-End</option>
              <option value="friendly">Friendly & Casual</option>
              <option value="local">Local Market (Zanzibar)</option>
              <option value="youth">Youth & Trendy</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Output Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageOption)}
              className="w-full bg-muted/40 border border-input rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="both">English & Swahili (Bilingual)</option>
              <option value="en">English Only</option>
              <option value="sw">Swahili Only</option>
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-destructive font-medium">{error}</p>}

        {/* Submit Button with Loading Animation */}
        <button
          type="submit"
          disabled={generating || !rawTitle.trim()}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-bold hover:opacity-95 transition shadow-lg disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {loadingStep}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" /> Generate Complete AI Listing
            </>
          )}
        </button>
      </form>

      {/* Generated Results Panel */}
      {result && (
        <div className="bg-muted/50 border border-border/80 p-5 rounded-3xl space-y-6 animate-in fade-in duration-300">
          
          {/* Score & Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Studio Output</span>
              <h4 className="text-sm font-black">Complete Optimized Listing</h4>
            </div>
            <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-xl border shadow-sm">
              <span className="text-xs font-bold text-muted-foreground">Listing Quality:</span>
              <span className="text-xs font-black text-emerald-600">{result.completenessScore}% ★★★★★</span>
            </div>
          </div>

          {/* Suggested Price Section (TZS) */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <DollarSign className="w-4 h-4" /> AI Price Recommendation (TZS)
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-card p-2 rounded-xl border">
                <div className="text-[10px] text-muted-foreground">Avg Market</div>
                <div className="text-xs font-bold">TZS {result.suggestedPriceTZS.avgMarket.toLocaleString()}</div>
              </div>
              <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
                <div className="text-[10px] opacity-90">Recommended</div>
                <div className="text-xs font-black">TZS {result.suggestedPriceTZS.recommended.toLocaleString()}</div>
              </div>
              <div className="bg-card p-2 rounded-xl border">
                <div className="text-[10px] text-muted-foreground">Premium</div>
                <div className="text-xs font-bold">TZS {result.suggestedPriceTZS.premium.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Titles (English & Swahili) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Optimized Titles</span>
              <button
                onClick={() => handleCopySection(`${result.titleEn}\n${result.titleSw}`, "titles")}
                className="text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border hover:bg-muted transition"
              >
                {copiedField === "titles" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedField === "titles" ? "Copied!" : "Copy Titles"}
              </button>
            </div>
            <div className="bg-card p-3 rounded-2xl border space-y-2 text-xs">
              <div><strong className="text-muted-foreground">EN:</strong> {result.titleEn}</div>
              <div className="pt-1 border-t"><strong className="text-muted-foreground">SW:</strong> {result.titleSw}</div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Descriptions</span>
              <button
                onClick={() => handleCopySection(result.longDescription, "desc")}
                className="text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border hover:bg-muted transition"
              >
                {copiedField === "desc" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedField === "desc" ? "Copied!" : "Copy Description"}
              </button>
            </div>
            <div className="bg-card p-3 rounded-2xl border text-xs text-muted-foreground leading-relaxed">
              {result.longDescription}
            </div>
          </div>

          {/* Bullet Features */}
          <div className="space-y-2">
            <span className="text-xs font-bold">Key Selling Points (Bullet Features)</span>
            <div className="bg-card p-3 rounded-2xl border space-y-1.5 text-xs">
              {result.bulletFeatures.map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> {feat}
                </div>
              ))}
            </div>
          </div>

          {/* Metadata & SEO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-card p-3 rounded-2xl border space-y-1">
              <span className="font-bold text-muted-foreground">Category Inferred:</span>
              <p className="font-semibold text-foreground">{result.recommendedCategory}</p>
            </div>
            <div className="bg-card p-3 rounded-2xl border space-y-1">
              <span className="font-bold text-muted-foreground">Package Weight:</span>
              <p className="font-semibold text-foreground">{result.shippingWeight}</p>
            </div>
          </div>

          {/* Tags & Keywords */}
          <div className="space-y-2">
            <span className="text-xs font-bold">Search Keywords & Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.map((kw, i) => (
                <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold">
                  #{kw}
                </span>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}


