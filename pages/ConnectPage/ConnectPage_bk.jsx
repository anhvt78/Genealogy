"use client";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import { checkChainId } from "@/components/Utils/helpers";
import sweetalert2 from "@/configs/swal";
import { ethers } from "ethers";

export default function ConnectPage() {
  // 1. Thêm state này vào đầu component FamilyTreePage
  const [isShaking, setIsShaking] = useState(false);

  // const triggerShake = () => {
  //   setIsShaking(true);
  //   setTimeout(() => setIsShaking(false), 500); // Tắt hiệu ứng sau 0.5s
  // };

  const [isProcessing, setIsProcessing] = useState(false);

  const dispatch = useDispatch();

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
      // onHide();
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
      <div
        className="absolute inset-0 z-[100] flex items-center justify-center bg-[#3d2611]/70 backdrop-blur-md transition-all duration-500"
        // onClick={triggerShake} // Rung khi click ra ngoài form
      >
        <div
          onClick={(e) => e.stopPropagation()} // Ngăn rung khi click vào bên trong form
          className={`bg-[#f2e2ba] p-10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b border-[#5d3a1a] max-w-md text-center transform transition-all 
              ${isShaking ? "animate-shake" : "scale-100"}`}
        >
          {/* Icon với hiệu ứng Ping cảnh báo */}
          <div className="mb-6 flex justify-center relative">
            <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-[#5d3a1a] opacity-20"></span>
            <div className="relative p-4 bg-[#5d3a1a] rounded-full shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                fill="#f2e2ba"
                viewBox="0 0 256 256"
              >
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
              </svg>
            </div>
          </div>

          <h3 className="text-[#3d2611] text-2xl font-black mb-4 uppercase tracking-tighter">
            Yêu cầu định danh
          </h3>

          <p className="text-[#5d3a1a] mb-8 text-lg leading-relaxed font-medium">
            Bạn cần kết nối Hồ sơ phổ quát để tương tác và lưu trữ dữ liệu trên
            mạng lưới blockchain.
          </p>

          <button
            onClick={connectWalletHandler}
            className="group relative w-full py-4 bg-[#5d3a1a] text-[#f2e2ba] font-bold rounded-lg overflow-hidden transition-all hover:bg-[#3d2611] active:scale-95 shadow-[0_5px_15px_rgba(0,0,0,0.3)]"
          >
            {isProcessing ? (
              <span>
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-4 h-4 mr-3 text-orange-500 animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#E5E7EB"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"
                  />
                </svg>
                ĐANG CHỜ KẾT NỐI
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-2">
                KẾT NỐI NGAY
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z"></path>
                </svg>
              </span>
            )}
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>

          <div className="mt-6 pt-6 border-t border-[#5d3a1a]/10">
            <p className="text-xs text-[#5d3a1a]/50 uppercase tracking-widest font-bold">
              Bảo mật • Minh bạch • Vĩnh viễn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
