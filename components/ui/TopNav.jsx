"use client";
import { useDispatch, useSelector } from "react-redux";
import { userSignOut } from "@/redux/genealogySlide";
import { useRouter } from "next/navigation";

export default function TopNav({ clanName, onBack }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const walletAddress = useSelector((s) => s.genealogyReducer.walletAddress);

  const truncateAddr = (a) => (a ? `${a.slice(0, 6)}···${a.slice(-4)}` : "");

  const handleSignOut = () => {
    dispatch(userSignOut());
    router.push("/");
  };

  return (
    <header
      className="w-full bg-[#3d2611] text-[#f2e2ba] px-4 sm:px-6 flex items-center justify-between shadow-[0_2px_16px_rgba(0,0,0,0.5)] flex-shrink-0 font-serif select-none"
      style={{ height: "56px" }}
    >
      {/* LEFT: Logo / Back */}
      <div className="flex items-center gap-3 min-w-0">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0 group"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              className="group-hover:-translate-x-0.5 transition-transform duration-150"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wider hidden sm:block">
              Danh sách
            </span>
          </button>
        ) : (
          <button
            onClick={() => router.push("/")}
            className="font-black uppercase tracking-[0.18em] text-sm sm:text-base hover:opacity-70 transition-opacity shrink-0"
          >
            Gia Phả Việt
          </button>
        )}

        {clanName && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#8b5a2b] text-xl leading-none">›</span>
            <span className="text-sm font-semibold truncate max-w-[90px] sm:max-w-[200px] opacity-75">
              {clanName}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: Wallet + Logout */}
      {walletAddress && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-[#5d3a1a]/60 border border-[#8b5a2b]/30 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
            <span className="text-xs font-mono tracking-tight opacity-90">
              {truncateAddr(walletAddress)}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            title="Ngắt kết nối ví"
            className="p-2 rounded-full hover:bg-[#5d3a1a] transition-colors"
          >
            <svg
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
