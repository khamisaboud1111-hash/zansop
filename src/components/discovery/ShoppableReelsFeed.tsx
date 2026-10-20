"use client";

import React, { useState, useRef } from "react";
import { Heart, MessageCircle, Share2, ShoppingBag, Volume2, VolumeX, Sparkles } from "lucide-react";
import Image from "next/image";

export interface ReelProduct {
  id: string | number;
  title: string;
  price: number;
  currency?: string;
  image: string;
}

export interface ReelItem {
  id: string | number;
  videoUrl: string;
  caption: string;
  creatorName: string;
  creatorAvatar: string;
  likesCount: number;
  commentsCount: number;
  product: ReelProduct;
}

interface ShoppableReelsFeedProps {
  reels: ReelItem[];
  onAddToCart?: (product: ReelProduct) => void;
}

export default function ShoppableReelsFeed({ reels = [], onAddToCart }: ShoppableReelsFeedProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState<{ [key: string]: { count: number; liked: boolean } }>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const toggleLike = (id: string | number) => {
    setLikes((prev) => {
      const current = prev[id] || { count: reels.find(r => r.id === id)?.likesCount || 0, liked: false };
      return {
        ...prev,
        [id]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked,
        },
      };
    });
  };

  const handleMuteToggle = () => {
    setMuted(!muted);
    videoRefs.current.forEach((vid) => {
      if (vid) vid.muted = !muted;
    });
  };

  if (!reels.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <Sparkles className="w-12 h-12 text-primary mb-3 animate-pulse" />
        <h3 className="text-lg font-bold">No Shoppable Reels Available</h3>
        <p className="text-sm text-muted-foreground mt-1">Check back soon for creator-curated product videos!</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[80vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-border/20">
      
      {/* Feed Container */}
      <div className="relative w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {reels.map((reel, idx) => {
          const currentLikes = likes[reel.id]?.count ?? reel.likesCount;
          const isLiked = likes[reel.id]?.liked ?? false;

          return (
            <div 
              key={reel.id} 
              className="relative w-full h-full snap-start flex items-center justify-center bg-zinc-950"
            >
              {/* Video Element */}
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                src={reel.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                autoPlay={idx === 0}
                muted={muted}
              />

              {/* Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

              {/* Top Controls (Mute Toggle) */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={handleMuteToggle}
                  className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                  aria-label="Toggle Sound"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Right Side Interaction Bar */}
              <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-5 text-white">
                {/* Creator Avatar */}
                <div className="relative w-12 h-12 rounded-full border-2 border-primary overflow-hidden shadow-lg">
                  <Image src={reel.creatorAvatar} alt={reel.creatorName} width={48} height={48} unoptimized className="w-full h-full object-cover" />
                </div>

                {/* Like Button */}
                <button 
                  onClick={() => toggleLike(reel.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={`p-3 rounded-full bg-black/40 backdrop-blur-md group-hover:scale-110 transition ${isLiked ? 'text-red-500' : 'text-white'}`}>
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-xs font-semibold">{currentLikes}</span>
                </button>

                {/* Comments Shortcut */}
                <div className="flex flex-col items-center gap-1">
                  <div className="p-3 rounded-full bg-black/40 backdrop-blur-md">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold">{reel.commentsCount}</span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center gap-1">
                  <div className="p-3 rounded-full bg-black/40 backdrop-blur-md">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold">Share</span>
                </div>
              </div>

              {/* Bottom Metadata & Embedded Shoppable Card */}
              <div className="absolute left-4 right-20 bottom-4 z-20 space-y-3">
                {/* Creator & Caption */}
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">@{reel.creatorName}</h4>
                  <p className="text-zinc-200 text-xs line-clamp-2 leading-relaxed">{reel.caption}</p>
                </div>

                {/* Attached Product Card */}
                <div className="flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Image
                      src={reel.product.image}
                      alt={reel.product.title}
                      width={48}
                      height={48}
                      unoptimized
                      className="w-12 h-12 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <h5 className="text-white text-xs font-medium line-clamp-1">{reel.product.title}</h5>
                      <p className="text-primary font-bold text-sm">
                        {reel.product.currency || "TZS"} {reel.product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddToCart && onAddToCart(reel.product)}
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-3.5 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-lg"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Buy
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

