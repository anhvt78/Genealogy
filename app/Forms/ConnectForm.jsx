"use client";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import { checkChainId } from "@/components/Utils/helpers";
import sweetalert2 from "@/configs/swal";
import { ethers } from "ethers";
import { useRouter } from "next/navigation"; // Thêm router để điều hướng
import { Html5Qrcode } from "html5-qrcode";

export default function ConnectForm() {
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
        text: "Vui lòng nhập địa chỉ dòng họ để tiếp tục.",
      });
      return;
    }
    // router.push(`/pages/detail/${inputClanId.trim()}`);
    router.push(`/pages/detail?id=${inputClanId.trim()}`);
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
              // await injectedProvider.request({
              //   method: "wallet_addEthereumChain",
              //   params: [
              //     {
              //       chainId: "0x1069",
              //       chainName: "LUKSO Testnet",
              //       nativeCurrency: {
              //         name: "Test LYX",
              //         symbol: "LYXt",
              //         decimals: 18,
              //       },
              //       rpcUrls: ["https://rpc.testnet.lukso.network"],
              //       blockExplorerUrls: [
              //         "https://explorer.execution.testnet.lukso.network",
              //       ],
              //     },
              //   ],
              // });
              await injectedProvider.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x2A", // 42 trong hệ thập phân
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
                title: "Error",
                text: "Failed to add LUKSO Network.",
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

  const [isMobile, setIsMobile] = useState(false);

  // useEffect(() => {
  //   // Kiểm tra User Agent hoặc chiều rộng màn hình
  //   const checkMobile = () => {
  //     const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  //     const isMobileDevice = /android|iphone|ipad|ipod/i.test(
  //       userAgent.toLowerCase(),
  //     );
  //     setIsMobile(isMobileDevice);
  //   };

  //   checkMobile();
  // }, []);

  // Sử dụng useRef để theo dõi trạng thái scanner, tránh khởi tạo nhiều lần
  const scannerRef = useRef(null);

  // 1. Kiểm tra thiết bị khi load trang
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      setIsMobile(isMobileDevice);
    };
    checkDevice();
  }, []);

  // Logic quét QR thực tế

  // Hàm khởi tạo camera tách biệt
  // const startScanner = async () => {
  //   // Đợi một chút để React render xong thẻ div#reader
  //   setTimeout(async () => {
  //     const element = document.getElementById("reader");
  //     if (!element) return; // Nếu vẫn chưa có thì thoát để tránh lỗi crash

  //     try {
  //       scannerRef.current = new Html5Qrcode("reader");
  //       const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  //       await scannerRef.current.start(
  //         { facingMode: "environment" },
  //         config,
  //         (decodedText) => {
  //           const clanId = decodedText.includes("/")
  //             ? decodedText.split("/").pop()
  //             : decodedText;
  //           stopScanner();
  //           // router.push(`/pages/detail/${clanId.trim()}`);
  //           router.push(`/pages/detail?id=${clanId.trim()}`);
  //         },
  //       );
  //     } catch (err) {
  //       console.error("Lỗi khởi tạo camera:", err);
  //       setIsScanning(false);
  //     }
  //   }, 100); // Delay 100ms để đảm bảo DOM đã sẵn sàng
  // };

  // Thêm một state để kiểm tra xem camera đã sẵn sàng chưa
  const [isCameraReady, setIsCameraReady] = useState(false);

  // const startScanner = async () => {
  //   try {
  //     // Luôn dọn dẹp scanner cũ trước khi bắt đầu
  //     if (scannerRef.current) {
  //       await stopScanner();
  //     }

  //     // Đợi một khoảng thời gian nhỏ để đảm bảo thẻ #reader đã lên giao diện
  //     setTimeout(async () => {
  //       const element = document.getElementById("reader");
  //       if (!element) return;

  //       const html5QrCode = new Html5Qrcode("reader");
  //       scannerRef.current = html5QrCode;

  //       const config = {
  //         fps: 15, // Tăng fps để quét mượt hơn trên mobile
  //         qrbox: { width: 250, height: 250 },
  //         aspectRatio: 1.0,
  //       };

  //       await html5QrCode.start(
  //         { facingMode: "environment" },
  //         config,
  //         (decodedText) => {
  //           // Xử lý logic lấy ID từ URL hoặc text thuần
  //           const urlParams = new URLSearchParams(decodedText.split("?")[1]);
  //           const clanId = urlParams.get("id") || decodedText.split("/").pop();

  //           stopScanner();
  //           router.push(`/pages/detail?id=${clanId.trim()}`);
  //         },
  //       );
  //       setIsCameraReady(true);
  //     }, 500);
  //   } catch (err) {
  //     console.error("Manual Camera Error:", err);
  //     setIsScanning(false);
  //     // Thông báo chi tiết hơn để debug
  //     sweetalert2.popupAlert({
  //       title: "Lỗi Camera",
  //       text: "Thiết bị báo lỗi: " + err.message,
  //     });
  //   }
  // };

  // Ref để tránh gọi stop() đồng thời nhiều lần
  const isStoppingRef = useRef(false);

  const safeStop = async () => {
    if (!scannerRef.current || isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      const state = scannerRef.current.getState?.();
      // getState: 2=SCANNING, 3=PAUSED
      if (state === 2 || state === 3) {
        await scannerRef.current.stop();
      }
    } catch (e) {
      if (
        !e?.message?.includes("not running") &&
        !e?.message?.includes("not scanning")
      ) {
        console.warn("safeStop warning:", e);
      }
    } finally {
      scannerRef.current = null;
      isStoppingRef.current = false;
    }
  };

  // Chọn camera sau phù hợp nhất — hỗ trợ cả iOS và Android
  const selectBackCamera = (cameras) => {
    if (!cameras?.length) return null;

    // Android: tên camera thường chứa "back", "facing back", "environment"
    // iOS: thường chứa "back", "Back"
    const backByLabel = cameras.find((c) =>
      /back|rear|environment|facing back/i.test(c.label),
    );
    if (backByLabel) return backByLabel;

    // Fallback: camera cuối trong danh sách
    // (thường là camera sau trên cả Android lẫn iOS)
    return cameras[cameras.length - 1];
  };

  // Hàm này được gọi TRỰC TIẾP từ user tap
  // iOS WebKit bắt buộc getUserMedia phải nằm trong user gesture
  const handleScanButtonClick = async () => {
    if (!isMobile) return;

    // Kiểm tra trình duyệt hỗ trợ
    if (!navigator.mediaDevices?.getUserMedia) {
      sweetalert2.popupAlert({
        title: "Không hỗ trợ",
        text: "Trình duyệt không hỗ trợ camera. Hãy dùng Safari hoặc Chrome mới nhất.",
      });
      return;
    }

    // Xin quyền camera NGAY TẠI ĐÂY — phải nằm trong user gesture
    // iOS Safari yêu cầu; Android Chrome cũng chấp nhận cách này
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      stream.getTracks().forEach((t) => t.stop());
    } catch (permErr) {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const msg =
        permErr.name === "NotAllowedError"
          ? isIOS
            ? "Quyền camera bị từ chối. Vào Cài đặt > Safari > Camera và cho phép trang này."
            : "Quyền camera bị từ chối. Nhấn vào biểu tượng khoá trên thanh địa chỉ và cho phép Camera."
          : permErr.name === "NotFoundError"
            ? "Không tìm thấy camera. Hãy kiểm tra thiết bị."
            : permErr.message || "Không thể truy cập camera.";
      sweetalert2.popupAlert({ title: "Lỗi Camera", text: msg });
      return;
    }

    // Quyền đã được cấp — hiện UI và để useEffect gọi startScanner()
    setIsScanning(true);
  };

  const startScanner = async () => {
    // Chờ DOM render xong thẻ #reader
    await new Promise((r) => setTimeout(r, 200));
    const element = document.getElementById("reader");
    if (!element) return;

    await safeStop();

    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      const onSuccess = (decodedText) => {
        const clanId = decodedText.includes("id=")
          ? new URLSearchParams(decodedText.split("?")[1]).get("id")
          : decodedText.split("/").pop();
        safeStop().then(() => {
          setIsScanning(false);
          router.push(`/pages/detail?id=${clanId.trim()}`);
        });
      };

      let started = false;

      // Thử lấy danh sách camera cụ thể trước
      // Android: getCameras() trả về đầy đủ sau khi đã grant permission
      // iOS: cũng hoạt động sau khi đã grant permission ở bước trên
      try {
        const cameras = await Html5Qrcode.getCameras();
        const chosen = selectBackCamera(cameras);
        if (chosen) {
          await html5QrCode.start(chosen.id, config, onSuccess);
          started = true;
        }
      } catch (_) {
        // Không lấy được danh sách — fallback bên dưới
      }

      // Fallback: dùng facingMode ideal — an toàn cho cả iOS và Android
      if (!started) {
        await html5QrCode.start(
          { facingMode: { ideal: "environment" } },
          config,
          onSuccess,
        );
      }

      setIsCameraReady(true);
    } catch (err) {
      console.error("Camera Error:", err);
      await safeStop();
      setTimeout(() => {
        setIsScanning(false);
        sweetalert2.popupAlert({
          title: "Lỗi Camera",
          text: err.message || "Không thể khởi động scanner.",
        });
      }, 0);
    }
  };

  const stopScanner = async () => {
    await safeStop();
    setIsScanning(false);
  };
  // 2. Logic khởi tạo và dừng Camera thực tế
  // Lắng nghe biến isScanning để kích hoạt/tắt
  // Cấu trúc lại useEffect để tránh render chồng chéo
  useEffect(() => {
    let isMounted = true;

    const initScanner = async () => {
      if (isScanning && isMobile && isMounted) {
        await startScanner();
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      safeStop();
    };
  }, [isScanning, isMobile]); // Thêm isMobile vào dependency

  // const handleAccessById = () => {
  //   if (!inputClanId.trim()) return;
  //   router.push(`/detail/${inputClanId.trim()}`);
  // };

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#3d2611]/70 backdrop-blur-md transition-all duration-500">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-[#f2e2ba] p-8 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-2 border-[#5d3a1a] w-full max-w-md text-center transform transition-all 
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
                placeholder="Nhập địa chỉ dòng họ (0x...)"
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
              {/* <button
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
              </button> */}

              <button
                onClick={handleScanButtonClick}
                className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all w-full
      ${
        isMobile
          ? "border-[#5d3a1a]/20 text-[#5d3a1a] hover:border-[#5d3a1a] active:scale-95"
          : "border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
      }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M224,144v48a16,16,0,0,1-16,16H160a8,8,0,0,1,0-16h48V144a8,8,0,0,1,16,0ZM96,208H48V160a8,8,0,0,0-16,0v48a16,16,0,0,0,16,16H96a8,8,0,0,0,0-16ZM208,32H160a8,8,0,0,0,0,16h48V96a8,8,0,0,0,16,0V48A16,16,0,0,0,208,32ZM48,96a8,8,0,0,0,16,0V48H96a8,8,0,0,0,0-16H48A16,16,0,0,0,32,48V96Z"></path>
                </svg>
                <span className="text-[10px] font-bold uppercase">Quét QR</span>
              </button>

              {/* Tooltip hiển thị khi rê chuột vào trên Desktop */}
              {!isMobile && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                  Chỉ hỗ trợ trên thiết bị di động
                </div>
              )}

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
          {/* {isScanning && (
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
          )} */}

          {/* Thay thế phần hiển thị Camera giả lập bằng code này */}
          {isScanning && (
            <div className="mt-4 relative bg-[#1a1007] rounded-lg border-2 border-[#5d3a1a] overflow-hidden">
              {/* Nút đóng camera */}
              <button
                onClick={() => stopScanner()}
                className="absolute top-2 right-2 z-50 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>

              {/* Đây là nơi Camera thực tế sẽ hiển thị */}
              <div id="reader" className="w-full"></div>

              <div className="py-2 bg-[#5d3a1a] text-[#f2e2ba] text-[10px] font-bold uppercase">
                Đang quét mã QR...
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
