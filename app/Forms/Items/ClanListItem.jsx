import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CLAN_COLORS = [
  "#5d3a1a",
  "#6b4423",
  "#7a4f2c",
  "#3d2611",
  "#8b5a2b",
  "#4a3018",
];

function getInitialsColor(name) {
  if (!name) return CLAN_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CLAN_COLORS[Math.abs(hash) % CLAN_COLORS.length];
}

function getInitials(name) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function SkeletonCard() {
  return (
    <div className="bg-[#f2e2ba] border-2 border-[#5d3a1a]/30 shadow-[6px_6px_0px_0px_rgba(93,58,26,0.08)] overflow-hidden animate-pulse">
      <div className="h-2 bg-[#5d3a1a]/10" />
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#5d3a1a]/15 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#5d3a1a]/15 rounded w-3/4" />
            <div className="h-3 bg-[#5d3a1a]/10 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-[#5d3a1a]/10 rounded w-full" />
          <div className="h-3 bg-[#5d3a1a]/10 rounded w-5/6" />
        </div>
        <div className="pt-3 flex items-center gap-2">
          <div className="h-3 bg-[#5d3a1a]/15 rounded w-24" />
          <div className="h-3 bg-[#5d3a1a]/10 rounded w-4" />
        </div>
      </div>
    </div>
  );
}

const ClanListItem = ({ clanId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clanName, setClanName] = useState("");
  const [clanDesc, setClanDesc] = useState("");
  const { getClanInfo } = useContext(GenealogyContext);

  useEffect(() => {
    if (!clanId) return;
    getClanInfo(clanId).then((result) => {
      setLoading(false);
      if (result.sts) {
        setClanName(result.data?.clanName || "");
        setClanDesc(result.data?.clanDesc || "");
      } else {
        sweetalert2.popupAlert({
          title: "Đã xảy ra lỗi",
          text: "Lỗi khi tải thông tin Gia phả.",
        });
      }
    });
  }, [clanId]);

  if (loading) return <SkeletonCard />;

  const initials = getInitials(clanName);
  const avatarColor = getInitialsColor(clanName);

  return (
    <div
      onClick={() => router.push(`/pages/detail?id=${clanId}`)}
      className="group cursor-pointer bg-[#f2e2ba] border-2 border-[#5d3a1a] shadow-[8px_8px_0px_0px_rgba(93,58,26,0.12)] hover:shadow-[14px_14px_0px_0px_rgba(93,58,26,0.22)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: avatarColor }} />

      <div className="p-6 flex flex-col flex-grow">
        {/* Header: avatar + name */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[#f2e2ba] font-black text-base shrink-0 shadow-md"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-[#3d2611] text-base font-bold uppercase tracking-wider leading-tight group-hover:text-[#8b5a2b] transition-colors truncate">
              {clanName || "—"}
            </h3>
            <p className="text-[#5d3a1a]/50 text-[10px] font-mono mt-0.5 truncate">
              {clanId.slice(0, 10)}···{clanId.slice(-6)}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-[#5d3a1a] text-sm leading-relaxed line-clamp-2 flex-grow italic opacity-80">
          {clanDesc || "Chưa có mô tả cho dòng tộc này."}
        </p>

        {/* Footer CTA */}
        <div className="mt-5 pt-4 border-t border-[#5d3a1a]/10 flex items-center justify-between">
          <span className="text-[#3d2611] font-bold text-xs uppercase tracking-widest">
            Xem chi tiết
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-[#5d3a1a] group-hover:translate-x-1.5 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ClanListItem;
