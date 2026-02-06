"use client";
import React from "react";
import sweetalert2 from "@/configs/swal";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { checkChainId } from "@/components/Utils/helpers";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import Modal from "./Modal"; // Sử dụng Modal tùy chỉnh dùng Tailwind
import { X } from "lucide-react";

export const ConnectorModal = ({ isShow, onHide }) => {
  const dispatch = useDispatch();

  const connectWalletHandler = async () => {
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
      onHide();
    } else {
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

  if (!isShow) return null;

  return (
    <Modal onClose={onHide} title="Wallet Web 3">
      <div className="p-6">
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">
            Connect to your universal profile
          </p>
        </div>

        <div
          onClick={connectWalletHandler}
          className="group flex items-center justify-start h-[70px] border border-[#ee4d2d] rounded-xl px-6 mb-4 cursor-pointer transition-all duration-300 bg-[#f8fafb] hover:bg-[#ee4d2d] hover:shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center group-hover:border-white">
              <video
                src="/animation01.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-medium text-slate-800 group-hover:text-white transition-colors">
              Login With Universal Profile
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
