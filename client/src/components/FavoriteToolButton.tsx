// Orbital Workbench: isolated button control so favorite actions never nest inside route links.
import { isFavorite, favoriteToolsEvent, toggleFavorite } from "@/lib/favoriteTools";
import { Star } from "lucide-react";
import type { ToolDefinition } from "@/data/toolRegistry";
import { useEffect, useState } from "react";

export default function FavoriteToolButton({ tool, className = "" }: { tool: ToolDefinition; className?: string }) { const [favorite, setFavorite] = useState(() => isFavorite(tool.slug)); useEffect(() => { const refresh = () => setFavorite(isFavorite(tool.slug)); window.addEventListener(favoriteToolsEvent(), refresh); return () => window.removeEventListener(favoriteToolsEvent(), refresh); }, [tool.slug]); const label = favorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`; return <button type="button" className={`favorite-tool-button ${favorite ? "favorite-tool-button--active" : ""} ${className}`} aria-label={label} aria-pressed={favorite} onClick={() => setFavorite(toggleFavorite(tool))}><Star size={15} fill={favorite ? "currentColor" : "none"} /><span>{favorite ? "Saved" : "Save"}</span></button>; }
