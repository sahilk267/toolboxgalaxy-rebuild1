import React, { useState, useEffect } from "react";
import { Vote, Check, Sparkles, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { unlockBadge } from "@/lib/achievementBadges";

interface ToolCandidate {
  id: string;
  title: string;
  category: string;
  description: string;
  votes: number;
}

const CANDIDATES: ToolCandidate[] = [
  {
    id: "svg-to-react",
    title: "SVG to React / CSS Icon Converter",
    category: "Developer",
    description: "Converts raw SVG code into optimized React JSX components or CSS data URIs.",
    votes: 142,
  },
  {
    id: "audio-trimmer",
    title: "In-Browser Audio Trimmer & Silence Remover",
    category: "Media",
    description: "Trim MP3/WAV tracks, cut podcasts, and clean silence with zero audio uploads.",
    votes: 109,
  },
  {
    id: "csv-to-sql",
    title: "CSV to Clean SQL & Markdown Generator",
    category: "Data",
    description: "Converts spreadsheets into PostgreSQL/MySQL schema tables and clean markdown.",
    votes: 88,
  },
  {
    id: "visual-diff",
    title: "Side-by-Side Visual Diff & Text Compare",
    category: "Code",
    description: "Compare two code snippets or contracts with split-screen inline diff highlights.",
    votes: 95,
  },
];

const STORAGE_VOTE_KEY = "tg_community_ballot_voted_id";

export const CommunityToolBallot: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_VOTE_KEY);
    }
    return null;
  });

  const [hasVoted, setHasVoted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return Boolean(localStorage.getItem(STORAGE_VOTE_KEY));
    }
    return false;
  });

  const handleVote = (id: string) => {
    setSelectedId(id);
    setHasVoted(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_VOTE_KEY, id);
      unlockBadge("community-voice");
    }
  };

  const totalVotes = CANDIDATES.reduce((acc, c) => acc + c.votes, hasVoted ? 1 : 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-[#0c182c]/90 via-[#0a1222] to-[#070d18] p-5 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Background ambient light */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-md shadow-sky-500/10">
            <Vote size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold px-1.5 py-0.5 rounded bg-sky-500/15">
                NEXT FRIDAY DROP
              </span>
              <span className="text-xs text-white/50 font-mono flex items-center gap-1">
                <Clock size={12} />
                Release drops every Friday
              </span>
            </div>
            <h2 className="font-display text-base font-bold text-white">
              Vote: Which tool should ship next?
            </h2>
          </div>
        </div>

        {hasVoted && (
          <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#c7f36b] bg-[#c7f36b]/15 px-2.5 py-1 rounded-full border border-[#c7f36b]/30">
            <Check size={13} />
            <span>Vote Recorded!</span>
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-white/70 leading-relaxed">
        We release one new community-voted utility or game module every Friday. Cast your vote below to decide this week&apos;s build priority.
      </p>

      {/* Ballot Candidates */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CANDIDATES.map((candidate) => {
          const isSelected = selectedId === candidate.id;
          const voteCount = candidate.votes + (isSelected ? 1 : 0);
          const percent = Math.round((voteCount / totalVotes) * 100);

          return (
            <div
              key={candidate.id}
              onClick={() => !hasVoted && handleVote(candidate.id)}
              className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? "border-[#c7f36b]/50 bg-[#c7f36b]/10 shadow-lg shadow-[#c7f36b]/5"
                  : hasVoted
                  ? "border-white/10 bg-white/[0.02]"
                  : "border-white/10 bg-white/[0.02] hover:border-sky-400/40 hover:bg-white/[0.05] cursor-pointer group"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                    {candidate.category}
                  </span>
                  {hasVoted ? (
                    <span className="text-xs font-mono font-bold text-sky-400">{percent}%</span>
                  ) : (
                    <span className="text-[11px] font-mono text-white/40 group-hover:text-sky-300">
                      Click to vote →
                    </span>
                  )}
                </div>
                <h3 className="font-display text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">
                  {candidate.title}
                </h3>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">{candidate.description}</p>
              </div>

              {/* Vote percentage bar when voted */}
              {hasVoted && (
                <div className="mt-3 pt-2 border-t border-white/5">
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected ? "bg-[#c7f36b]" : "bg-sky-400"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-white/50">
                    <span>{voteCount} votes</span>
                    {isSelected && <span className="text-[#c7f36b] font-semibold">Your Pick</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-white/50">
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-sky-400" />
          Poll closes Thursday midnight. Come back Friday to test the winner!
        </span>
        <span className="text-white/40">{totalVotes} community votes cast</span>
      </div>
    </div>
  );
};
