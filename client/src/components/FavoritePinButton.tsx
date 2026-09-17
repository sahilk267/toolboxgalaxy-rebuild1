import React from "react";
import { useFavorites } from "@/lib/favorites";
import { Star } from "lucide-react";

interface FavoritePinButtonProps {
  slug: string;
  className?: string;
  size?: number;
  label?: boolean;
}

export const FavoritePinButton: React.FC<FavoritePinButtonProps> = ({
  slug,
  className = "",
  size = 14,
  label = false,
}) => {
  const { isPinned, togglePin } = useFavorites();
  const pinned = isPinned(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(slug);
      }}
      className={`inline-flex items-center gap-1.5 transition-colors ${
        pinned
          ? "text-amber-400 hover:text-amber-300"
          : "text-white/40 hover:text-white/80"
      } ${className}`}
      title={pinned ? "Unpin from quick dock" : "Pin to quick dock"}
      aria-label={pinned ? "Unpin from quick dock" : "Pin to quick dock"}
    >
      <Star
        size={size}
        className={`transition-transform duration-200 ${
          pinned ? "fill-amber-400 scale-110" : "hover:scale-110"
        }`}
      />
      {label && (
        <span className="text-xs font-mono">
          {pinned ? "Pinned" : "Pin"}
        </span>
      )}
    </button>
  );
};
