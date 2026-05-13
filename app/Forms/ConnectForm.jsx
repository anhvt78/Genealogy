"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

const LUKSO_MAINNET_ID = 42;

const detectInjectedProvider = () => {
  if (typeof window === "undefined") return null;
  if (window.lukso) return window.lukso;
  if (window.ethereum?.isLukso) return window.ethereum;
  return null;
};

const detectGridContext = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top && !window.lukso;
  } catch {
    return true;
  }
};

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
    title: "Bảo tồn vĩnh viễn",
    desc: "Dữ liệu gia phả lưu trữ bất biến trên mạng lưới Blockchain LUKSO.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="5" r="3" />
        <circle cx="5" cy="19" r="3" />
        <circle cx="19" cy="19" r="3" />
        <line x1="12" y1="8" x2="5" y2="16" />
        <line x1="12" y1="8" x2="19" y2="16" />
      </svg>
    ),
    title: "Phả đồ tương tác",
    desc: "Xem và chỉnh sửa cây gia phả trực quan qua nhiều đời con cháu.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <path d="M14 14h3v3M17 17h3v3M14 17h3" />
      </svg>
    ),
    title: "Chia sẻ bằng QR",
    desc: "Tạo mã QR để chia sẻ gia phả qua thiệp, tờ rơi, băng-rôn in ấn.",
  },
];

export default function ConnectForm() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputClanId, setInputClanId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const scannerRef = useRef(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    setIsMobile(isMobileDevice);
  }, []);

  const handleAccessById = () => {
    if (
      !inputClanId.trim().startsWith("0x") ||
      inputClanId.trim().length !== 42
    ) {
      Swal.fire({
        title: "Địa chỉ không hợp lệ",
        text: "Vui lòng nhập đúng địa chỉ ví Blockchain (0x...)",
        icon: "error",
        confirmButtonColor: "#5d3a1a",
      });
      return;
    }
    router.push(`/pages/detail?id=${inputClanId.trim()}`);
  };

  const connectWalletHandler = () => {
    if (detectGridContext()) {
      connectViaUPProvider();
      return;
    }

    const provider = detectInjectedProvider();
    if (provider) {
      connectViaInjected();
      return;
    }

    Swal.fire({
      title: "Cần mở bằng ứng dụng",
      text: isMobile
        ? "Vui lòng nhấn 'Mở ứng dụng' để kết nối ví Universal Profiles."
        : "Không tìm thấy Universal Profile Extension. Vui lòng cài Extension để tiếp tục.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isMobile ? "Mở ứng dụng" : "Cài đặt ngay",
      cancelButtonText: "Để sau",
      confirmButtonColor: "#5d3a1a",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        if (isMobile) {
          handleOpenApp();
        } else {
          window.open(
            "https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn",
            "_blank",
          );
        }
      }
    });
  };

  const handleOpenApp = () => {
    const currentUrl = window.location.href;
    const appSchemeUrl = `up://view?url=${encodeURIComponent(currentUrl)}`;
    window.location.href = appSchemeUrl;
    setTimeout(() => {
      if (document.visibilityState === "visible") {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const androidUrl =
          "https://play.google.com/store/apps/details?id=io.universaleverything.universalprofiles";
        const iosUrl =
          "https://apps.apple.com/us/app/universal-profiles/id6702018631";
        window.location.href = isIOS ? iosUrl : androidUrl;
      }
    }, 2500);
  };

  const connectViaInjected = useCallback(async () => {
    setIsProcessing(true);
    try {
      const provider = detectInjectedProvider();
      if (!provider) throw new Error("NO_PROVIDER");
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      dispatch(setWalletAddress(accounts[0]));
    } catch {
      Swal.fire({ title: "Lỗi", text: "Không thể kết nối. Hãy thử lại.", icon: "error" });
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  const connectViaUPProvider = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { createClientUPProvider } = await import("@lukso/up-provider");
      const upProvider = createClientUPProvider();
      const accounts = await upProvider.request({ method: "eth_accounts" });
      dispatch(setWalletAddress(accounts[0]));
    } catch {
      Swal.fire({ title: "Lỗi", text: "Lỗi kết nối trong môi trường Grid.", icon: "error" });
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  const safeStop = async () => {
    if (!scannerRef.current || isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (scannerRef.current.getState?.() >= 2) await scannerRef.current.stop();
    } catch (e) {
      console.warn(e);
    } finally {
      scannerRef.current = null;
      isStoppingRef.current = false;
    }
  };

  const startScanner = async () => {
    await new Promise((r) => setTimeout(r, 200));
    const element = document.getElementById("reader");
    if (!element) return;
    await safeStop();
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: { ideal: "environment" } },
        { fps: 10, qrbox: 250 },
        (text) => {
          const clanId = text.includes("id=")
            ? new URLSearchParams(text.split("?")[1]).get("id")
            : text.split("/").pop();
          safeStop().then(() => {
            setIsScanning(false);
            router.push(`/pages/detail?id=${clanId.trim()}`);
          });
        },
      );
    } catch {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isScanning && isMobile) startScanner();
    return () => safeStop();
  }, [isScanning, isMobile]);

  return (
    <div className="w-full h-screen flex overflow-hidden font-serif">
      {/* ===== LEFT: Hero Panel ===== */}
      <div className="hidden md:flex md:w-[55%] bg-[#3d2611] text-[#f2e2ba] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #f2e2ba 0px, #f2e2ba 1px, transparent 0px, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Top logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 border-2 border-[#8b5a2b] flex items-center justify-center">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="3"/>
                <circle cx="5" cy="19" r="3"/>
                <circle cx="19" cy="19" r="3"/>
                <line x1="12" y1="8" x2="5" y2="16"/>
                <line x1="12" y1="8" x2="19" y2="16"/>
              </svg>
            </div>
            <span className="text-xl font-black uppercase tracking-[0.2em]">Gia Phả Việt</span>
          </div>
          <div className="flex items-center gap-3 ml-1">
            <div className="h-[1px] w-8 bg-[#8b5a2b]" />
            <p className="text-[#8b5a2b] text-xs uppercase tracking-widest font-semibold">
              Nơi dòng dõi Việt mãi lưu truyền
            </p>
          </div>
        </div>

        {/* Center: Main headline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-8">
          <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
            Lưu giữ<br />
            <span className="text-[#8b5a2b]">lịch sử</span><br />
            dòng tộc
          </h1>
          <p className="text-[#f2e2ba]/60 text-base leading-relaxed max-w-sm">
            Xây dựng cây gia phả số hoá bất biến trên Blockchain, kết nối
            các thế hệ và bảo tồn di sản gia đình mãi mãi.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-5">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-11 h-11 border border-[#8b5a2b]/40 flex items-center justify-center text-[#8b5a2b] shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wider mb-0.5">{f.title}</p>
                <p className="text-[#f2e2ba]/55 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 mt-8 pt-6 border-t border-[#5d3a1a]">
          <p className="text-[10px] text-[#8b5a2b]/60 uppercase tracking-[0.25em] font-black">
            Bảo mật · Minh bạch · Vĩnh viễn
          </p>
        </div>
      </div>

      {/* ===== RIGHT: Form Panel ===== */}
      <div className="w-full md:w-[45%] bg-[#e8d5b5] flex flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand */}
          <div className="md:hidden text-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-[#3d2611] mb-1">
              Gia Phả Việt
            </h2>
            <p className="text-[#5d3a1a]/60 text-xs uppercase tracking-widest font-semibold">
              Nơi dòng dõi Việt mãi lưu truyền
            </p>
          </div>

          {/* Form card */}
          <div className="bg-[#f2e2ba] border-2 border-[#5d3a1a] p-8 shadow-[12px_12px_0px_0px_rgba(93,58,26,0.15)]">
            <h3 className="text-[#3d2611] text-base font-black mb-1 uppercase tracking-widest text-center">
              Truy cập gia phả
            </h3>
            <p className="text-[#5d3a1a]/70 text-xs text-center mb-7 leading-relaxed">
              Nhập mã định danh, quét QR hoặc kết nối ví.
            </p>

            <div className="space-y-4">
              {/* Address input */}
              <div className="relative">
                <input
                  type="text"
                  value={inputClanId}
                  onChange={(e) => setInputClanId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAccessById()}
                  placeholder="Nhập địa chỉ dòng họ (0x...)"
                  className="w-full pl-4 pr-[90px] py-3 bg-white/60 border-2 border-[#5d3a1a]/25 text-[#3d2611] text-sm focus:border-[#5d3a1a] focus:bg-white outline-none transition-all placeholder:text-[#5d3a1a]/40"
                />
                <button
                  onClick={handleAccessById}
                  className="absolute right-0 top-0 bottom-0 px-3 bg-[#5d3a1a] text-[#f2e2ba] text-xs font-black uppercase tracking-wider hover:bg-[#3d2611] transition-colors"
                >
                  Truy cập
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px bg-[#5d3a1a]/15 flex-grow" />
                <span className="text-[10px] font-black text-[#5d3a1a]/35 uppercase tracking-widest">Hoặc</span>
                <div className="h-px bg-[#5d3a1a]/15 flex-grow" />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => isMobile && setIsScanning(true)}
                  disabled={!isMobile}
                  className={`flex flex-col items-center gap-2.5 p-4 border-2 rounded transition-all ${
                    isMobile
                      ? "border-[#5d3a1a]/30 text-[#5d3a1a] hover:border-[#5d3a1a] hover:bg-[#5d3a1a]/5"
                      : "border-[#5d3a1a]/10 text-[#5d3a1a]/30 cursor-not-allowed"
                  }`}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <path d="M14 14h3v3M17 17h3v3M14 17h3" />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {isMobile ? "Quét QR" : "Chỉ mobile"}
                  </span>
                </button>

                <button
                  onClick={connectWalletHandler}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-2.5 p-4 border-2 border-[#5d3a1a]/30 text-[#5d3a1a] hover:border-[#5d3a1a] hover:bg-[#5d3a1a]/5 rounded transition-all disabled:opacity-60"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-2 border-[#5d3a1a] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-wider">Kết nối Ví</span>
                </button>
              </div>

              {/* QR Scanner */}
              {isScanning && (
                <div className="relative bg-black rounded overflow-hidden border-2 border-[#5d3a1a]">
                  <button
                    onClick={() => setIsScanning(false)}
                    className="absolute top-2 right-2 z-50 w-7 h-7 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                  <div id="reader" className="w-full" />
                </div>
              )}
            </div>
          </div>

          {/* LUKSO badge */}
          <p className="text-center mt-5 text-[10px] text-[#5d3a1a]/40 uppercase tracking-[0.2em] font-black">
            Chạy trên mạng lưới LUKSO Blockchain
          </p>
        </div>
      </div>
    </div>
  );
}
