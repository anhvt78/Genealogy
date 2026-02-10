"use client";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import { checkChainId } from "@/components/Utils/helpers";
import sweetalert2 from "@/configs/swal";
import { ethers } from "ethers";
import { useRouter } from "next/navigation"; // Thêm router để điều hướng

export default function ConnectPage() {
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputClanId, setInputClanId] = useState(""); // State cho ô nhập liệu
  const [isScanning, setIsScanning] = useState(false); // State cho hiệu ứng giả lập scan

  const dispatch = useDispatch();
  const router = useRouter();

  // Hàm xử lý khi nhập ID thủ công
  const handleAccessById = () => {
    if (!inputClanId.trim()) {
      sweetalert2.popupAlert({
        title: "Thông báo",
        text: "Vui lòng nhập Clan ID để tiếp tục.",
      });
      return;
    }
    router.push(`/detail/${inputClanId.trim()}`);
  };

  const connectWalletHandler = async () => {
    setIsProcessing(true);
    if (typeof window.lukso !== "undefined") {
      const injectedProvider = window.lukso;
      const isCorrectChain = await checkChainId(injectedProvider);

      if (!isCorrectChain) {
        try {
          await injectedProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x1069" }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await injectedProvider.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x1069",
                    chainName: "LUKSO Testnet",
                    nativeCurrency: {
                      name: "Test LYX",
                      symbol: "LYXt",
                      decimals: 18,
                    },
                    rpcUrls: ["https://rpc.testnet.lukso.network"],
                    blockExplorerUrls: [
                      "https://explorer.execution.testnet.lukso.network",
                    ],
                  },
                ],
              });
            } catch (addError) {
              sweetalert2.popupAlert({
                title: "Error",
                text: "Failed to add LUKSO Testnet.",
              });
              return;
            }
          }
        }
      }

      const provider = new ethers.providers.Web3Provider(injectedProvider);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();

      dispatch(setWalletAddress(walletAddress));
      setIsProcessing(false);
    } else {
      setIsProcessing(false);
      sweetalert2
        .popupAlert({
          title: "Connect Wallet",
          text: "Universal Profile not detected. Please install the extension.",
        })
        .then(() => {
          window.open(
            "https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn",
            "_blank",
          );
        });
    }
  };

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#3d2611]/70 backdrop-blur-md transition-all duration-500">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-[#f2e2ba] p-8 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-4 border-[#5d3a1a] w-full max-w-md text-center transform transition-all 
              ${isShaking ? "animate-shake" : "scale-100"}`}
        >
          {/* Header & Icon */}
          <div className="mb-4 flex justify-center relative">
            <div className="relative p-3 bg-[#5d3a1a] rounded-full shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#f2e2ba"
                viewBox="0 0 256 256"
              >
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"></path>
                <path d="M128,80a12,12,0,1,0,12,12A12,12,0,0,0,128,80Zm0,96a8,8,0,0,0,8-8V128a8,8,0,0,0-16,0v40A8,8,0,0,0,128,176Z"></path>
              </svg>
            </div>
          </div>

          <h3 className="text-[#3d2611] text-xl font-black mb-2 uppercase tracking-widest">
            Truy cập gia phả
          </h3>
          <p className="text-[#5d3a1a] mb-6 text-sm opacity-80">
            Nhập mã định danh, quét mã QR hoặc kết nối ví để bắt đầu.
          </p>

          <div className="space-y-4">
            {/* PHẦN 1: NHẬP ID THỦ CÔNG */}
            <div className="relative group">
              <input
                type="text"
                value={inputClanId}
                onChange={(e) => setInputClanId(e.target.value)}
                placeholder="Nhập Clan ID (0x...)"
                className="w-full px-4 py-3 bg-[#e8d5b5]/50 border-2 border-[#5d3a1a]/20 rounded-lg text-[#3d2611] placeholder-[#5d3a1a]/40 focus:border-[#5d3a1a] focus:outline-none transition-all text-sm"
              />
              <button
                onClick={handleAccessById}
                className="absolute right-2 top-1.5 px-3 py-1.5 bg-[#5d3a1a] text-[#f2e2ba] rounded-md text-xs font-bold hover:bg-[#3d2611] transition-colors"
              >
                TRUY CẬP
              </button>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="h-[1px] bg-[#5d3a1a]/20 flex-grow"></div>
              <span className="text-[10px] font-bold text-[#5d3a1a]/40 uppercase">
                Hoặc
              </span>
              <div className="h-[1px] bg-[#5d3a1a]/20 flex-grow"></div>
            </div>

            {/* PHẦN 2: SCAN & WALLET */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all ${
                  isScanning
                    ? "bg-[#5d3a1a] text-[#f2e2ba] border-[#5d3a1a]"
                    : "bg-transparent border-[#5d3a1a]/20 text-[#5d3a1a] hover:border-[#5d3a1a]"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M224,144v48a16,16,0,0,1-16,16H160a8,8,0,0,1,0-16h48V144a8,8,0,0,1,16,0ZM96,208H48V160a8,8,0,0,0-16,0v48a16,16,0,0,0,16,16H96a8,8,0,0,0,0-16ZM208,32H160a8,8,0,0,0,0,16h48V96a8,8,0,0,0,16,0V48A16,16,0,0,0,208,32ZM48,96a8,8,0,0,0,16,0V48H96a8,8,0,0,0,0-16H48A16,16,0,0,0,32,48V96ZM80,88h32a8,8,0,0,1,8,8v32a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V96A8,8,0,0,1,80,88Zm24,32V104H88v16Zm40-32h32a8,8,0,0,1,8,8v32a8,8,0,0,1-8,8H144a8,8,0,0,1-8-8V96A8,8,0,0,1,144,88Zm24,32V104H152v16Zm-88,24h32a8,8,0,0,1,8,8v32a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V152A8,8,0,0,1,80,144Zm24,32V160H88v16Zm40-32h8a8,8,0,0,1,0,16h-8a8,8,0,0,1,0-16Zm24,24a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,168,168Zm0-24a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,168,144Zm-24,24a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,144,168Z"></path>
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  Quét QR Code
                </span>
              </button>

              <button
                onClick={connectWalletHandler}
                disabled={isProcessing}
                className="flex flex-col items-center gap-2 p-3 bg-transparent border-2 border-[#5d3a1a]/20 text-[#5d3a1a] rounded-xl hover:border-[#5d3a1a] transition-all active:scale-95"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5d3a1a]"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M216,72H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,64V192a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72Zm0,128H56a8,8,0,0,1-8-8V85.38A23.83,23.83,0,0,0,56,88H216v40H184a24,24,0,0,0,0,48h32v24Zm0-48H184a8,8,0,0,1,0-16h32Z"></path>
                  </svg>
                )}
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  Kết nối Ví
                </span>
              </button>
            </div>
          </div>

          {/* Vùng hiển thị Camera giả lập khi bấm Scan */}
          {isScanning && (
            <div className="mt-4 p-4 bg-[#1a1007] rounded-lg border-2 border-dashed border-[#5d3a1a] animate-pulse">
              <div className="text-[10px] text-[#f2e2ba]/60 mb-1">
                Đang khởi động Camera...
              </div>
              <div className="h-24 flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-[#f2e2ba]/30 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 animate-scan"></div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#5d3a1a]/10">
            <p className="text-[10px] text-[#5d3a1a]/50 uppercase tracking-[0.2em] font-black">
              Bảo mật • Minh bạch • Vĩnh viễn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
