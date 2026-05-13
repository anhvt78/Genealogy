"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GenealogyContext } from "@/context/GenealogyContext";
import ClanListItem from "./Items/ClanListItem";
import sweetalert2 from "@/configs/swal";
import Lottie from "lottie-react";
import loaderAnimation from "../assets/animations/loader.json";
import TopNav from "@/components/ui/TopNav";

export default function ClanListForm({ userWalletAddress }) {
  const router = useRouter();
  const { getNFTCollection, createClan } = useContext(GenealogyContext);
  const [isLoading, setIsLoading] = useState(true);
  const [allClanId, setAllClanId] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStillAlive, setIsStillAlive] = useState(false);
  const [formData, setFormData] = useState({
    clanName: "",
    ancestorName: "",
    description: "",
    ancestorDesc: "",
    birthDate: "",
    deathDate: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const parseDateInput = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return { year: 0, month: 0, day: 0 };
    const parts = dateStr.split(/[\/\-.]/);
    if (parts.length === 3) {
      return { day: parseInt(parts[0]) || 0, month: parseInt(parts[1]) || 0, year: parseInt(parts[2]) || 0 };
    } else if (parts.length === 1) {
      return { day: 0, month: 0, year: parseInt(parts[0]) || 0 };
    }
    return { year: parseInt(dateStr) || 0, month: 0, day: 0 };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    const formattedData = {
      ...formData,
      birthDate: parseDateInput(formData.birthDate),
      deathDate: isStillAlive ? { year: 0, month: 0, day: 0 } : parseDateInput(formData.deathDate),
    };
    createClan(userWalletAddress, formattedData, callBack, handleErr);
  };

  const callBack = (clanId) => {
    setIsProcessing(false);
    setIsModalOpen(false);
    router.push(`/pages/detail?id=${clanId}`);
  };

  const handleErr = (title, error) => {
    setIsProcessing(false);
    sweetalert2.popupAlert({ title, text: error });
  };

  const getClanId = () => {
    getNFTCollection(userWalletAddress).then((result) => {
      setIsLoading(false);
      if (result.sts) {
        setAllClanId(result.data.allNFT);
        setIsCreator(result.data.isCreator);
      } else {
        sweetalert2.popupAlert({ title: "Đã xảy ra lỗi", text: "Lỗi khi tải danh sách Gia phả." });
      }
    });
  };

  useEffect(() => {
    if (!userWalletAddress) return;
    getClanId();
  }, [userWalletAddress]);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-[#e8d5b5] font-serif">
      {/* Navbar */}
      <TopNav />

      {/* Content */}
      <div className="flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-44 h-44">
              <Lottie animationData={loaderAnimation} loop={true} />
            </div>
            <p className="text-[#3d2611] animate-pulse text-lg tracking-widest uppercase font-bold mt-2">
              Đang kết nối tới blockchain...
            </p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-black text-[#3d2611] tracking-[0.18em] uppercase mb-4">
                Gia Phả Của Tôi
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-[2px] w-16 bg-[#5d3a1a]" />
                <p className="text-[#5d3a1a] italic text-base">
                  Cây có cội, nước có nguồn
                </p>
                <div className="h-[2px] w-16 bg-[#5d3a1a]" />
              </div>
              {!isLoading && allClanId.length > 0 && (
                <p className="mt-3 text-[#5d3a1a]/60 text-xs uppercase tracking-widest font-semibold">
                  {allClanId.length} gia phả đang lưu trữ
                </p>
              )}
            </div>

            {/* Empty state */}
            {allClanId.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-md">
                <div className="w-24 h-24 border-4 border-dashed border-[#5d3a1a]/25 rounded-full flex items-center justify-center mb-6">
                  <svg width="40" height="40" fill="none" stroke="#5d3a1a" strokeWidth="1.5" viewBox="0 0 24 24" className="opacity-30">
                    <circle cx="12" cy="5" r="3"/>
                    <circle cx="5" cy="19" r="3"/>
                    <circle cx="19" cy="19" r="3"/>
                    <line x1="12" y1="8" x2="5" y2="16"/>
                    <line x1="12" y1="8" x2="19" y2="16"/>
                  </svg>
                </div>
                <h3 className="text-[#3d2611] font-black text-lg uppercase tracking-wider mb-3">
                  Chưa có gia phả nào
                </h3>
                <p className="text-[#5d3a1a]/65 text-sm leading-relaxed mb-8 italic">
                  Hãy bắt đầu lưu giữ lịch sử dòng tộc của bạn. Mỗi gia phả là một di sản vô giá cho con cháu mai sau.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-[#5d3a1a] text-[#f2e2ba] font-bold uppercase tracking-widest hover:bg-[#3d2611] transition-all shadow-[6px_6px_0px_0px_rgba(61,38,17,0.2)] hover:shadow-[8px_8px_0px_0px_rgba(61,38,17,0.3)] active:scale-95"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4"/>
                  </svg>
                  Tạo gia phả đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 max-w-7xl w-full">
                {allClanId.map((clanId, index) => (
                  <ClanListItem clanId={clanId} key={index} />
                ))}

                {/* Add new placeholder */}
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="border-3 border-dashed border-[#5d3a1a]/25 flex flex-col items-center justify-center p-8 opacity-50 hover:opacity-90 transition-all cursor-pointer group min-h-[180px]"
                  style={{ borderWidth: "3px" }}
                >
                  <div className="w-14 h-14 rounded-full bg-[#5d3a1a]/10 flex items-center justify-center mb-4 group-hover:bg-[#5d3a1a] group-hover:text-[#f2e2ba] transition-all duration-200 text-[#5d3a1a]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-bold text-[#5d3a1a] uppercase tracking-tight text-sm">
                    Thêm gia tộc mới
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal tạo gia phả */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#f2e2ba] border-4 border-[#5d3a1a] w-full max-w-lg p-6 md:p-8 shadow-[20px_20px_0px_0px_rgba(93,58,26,0.3)] relative animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-2xl text-[#5d3a1a] hover:rotate-90 transition-transform z-10"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-[#3d2611] uppercase tracking-widest mb-6 text-center border-b-2 border-[#5d3a1a] pb-2">
              Khai báo gia tộc
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                  Tên dòng tộc <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="clanName"
                  required
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm transition-colors"
                  placeholder="VD: Nguyễn Tộc"
                />
              </div>

              <div>
                <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                  Thông tin sơ lược
                </label>
                <textarea
                  name="description"
                  rows="2"
                  onChange={handleInputChange}
                  placeholder="Thông tin sơ lược về dòng tộc."
                  className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                  Tên Thuỷ tổ <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="ancestorName"
                  required
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm transition-colors"
                  placeholder="Tên vị tổ tiên đời thứ nhất"
                />
              </div>

              <div>
                <label className="block text-[#3d2611] font-bold mb-1 text-xs uppercase">
                  Tiểu sử tóm tắt của Thủy tổ
                </label>
                <textarea
                  name="ancestorDesc"
                  onChange={handleInputChange}
                  placeholder="Nhập tiểu sử ngắn gọn của vị thủy tổ..."
                  rows="3"
                  className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm resize-none transition-colors"
                />
              </div>

              <div className="flex flex-col md:grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                    Năm/Ngày sinh
                  </label>
                  <input
                    type="text"
                    name="birthDate"
                    onChange={handleInputChange}
                    placeholder="VD: 01/01/1980 hoặc 1980"
                    className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm h-[42px] transition-colors"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[#5d3a1a] font-bold text-xs uppercase">
                      Năm/Ngày mất
                    </label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-[#5d3a1a] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isStillAlive}
                        onChange={(e) => setIsStillAlive(e.target.checked)}
                        className="accent-[#5d3a1a]"
                      />
                      CÒN SỐNG
                    </label>
                  </div>
                  <input
                    type="text"
                    name="deathDate"
                    disabled={isStillAlive}
                    onChange={handleInputChange}
                    placeholder={isStillAlive ? "Đang trống..." : "VD: 01/01/1980 hoặc 1980"}
                    className={`w-full border-2 border-[#5d3a1a] p-2 outline-none text-sm h-[42px] transition-all ${
                      isStillAlive ? "bg-gray-300/50 opacity-50 cursor-not-allowed" : "bg-white/50 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#5d3a1a] text-[#f2e2ba] font-bold py-4 mt-2 hover:bg-[#3d2611] transition-all uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
              >
                {isProcessing && (
                  <div className="w-5 h-5 border-2 border-[#f2e2ba] border-t-transparent rounded-full animate-spin" />
                )}
                <span>Xác nhận khởi tạo</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
