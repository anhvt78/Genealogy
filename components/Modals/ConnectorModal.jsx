"use client";
import React, { useState } from "react";
import sweetalert2 from "@/configs/swal";
import { ethers } from "ethers";
import { checkChainId } from "@/components/Utils/helpers";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import Modal from "./Modal";

export const ConnectorModal = ({ isShow, onHide }) => {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);

  const connectWalletHandler = async () => {
    setIsProcessing(true);
    if (typeof window.lukso !== "undefined") {
      const injectedProvider = window.lukso;
      const isCorrectChain = await checkChainId(injectedProvider);

      if (!isCorrectChain) {
        try {
          await injectedProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x2A" }], // LUKSO Mainnet
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await injectedProvider.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x2A",
                    chainName: "LUKSO Mainnet",
                    nativeCurrency: {
                      name: "LYX",
                      symbol: "LYX",
                      decimals: 18,
                    },
                    rpcUrls: ["https://rpc.mainnet.lukso.network"],
                    blockExplorerUrls: [
                      "https://explorer.execution.mainnet.lukso.network",
                    ],
                  },
                ],
              });
            } catch (addError) {
              sweetalert2.popupAlert({
                title: "Lỗi",
                text: "Không thể thêm mạng LUKSO.",
              });
              setIsProcessing(false);
              return;
            }
          }
        }
      }

      try {
        const provider = new ethers.providers.Web3Provider(injectedProvider);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const walletAddress = await signer.getAddress();

        dispatch(setWalletAddress(walletAddress));
        onHide();
      } catch (err) {
        console.error("User denied account access");
      } finally {
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
      sweetalert2
        .popupAlert({
          title: "Kết nối ví",
          text: "Không tìm thấy Universal Profile. Vui lòng cài đặt tiện ích mở rộng.",
        })
        .then(() => {
          window.open(
            "https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn",
            "_blank",
          );
        });
    }
  };

  if (!isShow) return null;

  return (
    <Modal onClose={onHide}>
      <div className="p-8 bg-[#f2e2ba] rounded-xl text-center">
        {/* Header & Icon theo style ConnectForm */}
        <div className="mb-4 flex justify-center">
          <div className="p-3 bg-[#5d3a1a] rounded-full shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="#f2e2ba"
              viewBox="0 0 256 256"
            >
              <path d="M216,72H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,64V192a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72Zm0,128H56a8,8,0,0,1-8-8V85.38A23.83,23.83,0,0,0,56,88H216v40H184a24,24,0,0,0,0,48h32v24Zm0-48H184a8,8,0,0,1,0-16h32Z"></path>
            </svg>
          </div>
        </div>

        <h3 className="text-[#3d2611] text-xl font-black mb-2 uppercase tracking-widest">
          Kết nối quản trị
        </h3>
        <p className="text-[#5d3a1a] mb-8 text-sm opacity-80">
          Vui lòng kết nối với Universal Profile của bạn để thực hiện các thao
          tác quản lý gia phả.
        </p>

        {/* Nút kết nối chính */}
        <button
          onClick={connectWalletHandler}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-4 h-[64px] bg-[#5d3a1a] hover:bg-[#3d2611] text-[#f2e2ba] rounded-xl font-bold transition-all active:scale-95 shadow-lg disabled:opacity-70"
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f2e2ba]"></div>
          ) : (
            <>
              {/* <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-[#f2e2ba]/20">
                <video
                  src="/animation01.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div> */}
              <span className="uppercase tracking-tight text-sm">
                Đăng nhập
              </span>
            </>
          )}
        </button>

        <div className="mt-8 pt-6 border-t border-[#5d3a1a]/10">
          <p className="text-[10px] text-[#5d3a1a]/50 uppercase tracking-[0.2em] font-black">
            Bảo mật • Minh bạch • Vĩnh viễn
          </p>
        </div>
      </div>
    </Modal>
  );
};
