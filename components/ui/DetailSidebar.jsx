import React, { useContext, useEffect, useState, useRef } from "react";
import { formatDate } from "../Utils/helpers";

const GENERATION_LABELS = {
  1: "Tiên tổ", 2: "Nhị đại tôn", 3: "Tam đại tôn", 4: "Tứ đại tôn",
  5: "Ngũ đại tôn", 6: "Lục đại tôn", 7: "Thất đại tôn", 8: "Bát đại tôn",
  9: "Cửu đại tôn", 10: "Thập đại tôn",
};
import { GenealogyContext } from "@/context/GenealogyContext";
import AddSpouseModal from "./AddSpouseModal";
import AddChildModal from "./AddChildModal";
import UpdateMemberModal from "./UpdateMemberModal";
import { useSelector } from "react-redux";
import sweetalert2 from "@/configs/swal";
import Swal from "sweetalert2";
import { generateMetadataLink } from "@/components/Utils/helpers";

const ANCESTOR_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

function buildAncestryChain(personId, familyData) {
  const person = familyData?.find((p) => p.id === personId);
  if (!person) return [];
  if (!person.parents?.length) return [person];
  return [...buildAncestryChain(person.parents[0], familyData), person];
}

export default function DetailSidebar({
  person,
  clanItem,
  familyData,
  onClose,
  fetchDataDialog,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("sidebarWidth");
      return savedWidth ? parseInt(savedWidth, 10) : 384;
    }
    return 384;
  });

  const isResizing = useRef(false);

  function resize(e) {
    if (isResizing.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 900) {
        setWidth(newWidth);
      }
    }
  }

  function stopResizing() {
    isResizing.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
    if (typeof document !== "undefined") {
      document.body.classList.remove("is-resizing");
    }
  }

  function startResizing(e) {
    isResizing.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
    if (typeof document !== "undefined") {
      document.body.classList.add("is-resizing");
    }
  }

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("is-resizing");
      }
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", width);
  }, [width]);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    targetId: null,
  });

  const [modalAddChildState, setModalAddChildState] = useState(false);
  const [modalUpdateState, setModalUpdateState] = useState(false);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const { getOwner, removeChild, removeSpouse, getPersonDetail } =
    useContext(GenealogyContext);

  const [owner, setOwner] = useState("0x");

  const [currentIndex, setCurrentIndex] = useState(null);
  const [isGettingMetadata, setIsGettingMetadata] = useState(true);
  const [personDetail, setPersonDetail] = useState(null);

  useEffect(() => {
    if (!userWalletAddress) return;
    getOwner(clanItem?.clanId, person.id).then((result) => {
      setIsProcessing(false);
      if (result.sts) {
        setOwner(result.data);
      }
    });
  }, [userWalletAddress, person]);

  useEffect(() => {
    getPersonDetail(clanItem?.clanId, person.id).then((personMetadataResult) => {
      setIsGettingMetadata(false);
      if (personMetadataResult.sts) {
        let allImageUrls = [];
        try {
          const imagesData = personMetadataResult?.data?.images;
          if (Array.isArray(imagesData)) {
            allImageUrls = imagesData
              .map((subArray) => {
                if (Array.isArray(subArray) && subArray.length > 0) {
                  return generateMetadataLink(subArray[0]?.url);
                }
                return null;
              })
              .filter((url) => url);
          }
        } catch {}
        setPersonDetail({
          allImageUrls,
          description: personMetadataResult?.data?.description,
        });
      }
    });
  }, [person]);

  const handleDelete = async () => {
    Swal.fire({
      title: "Xác nhận xóa?",
      text: `Bạn có chắc chắn muốn xóa ${person.name} khỏi gia phả? Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Đang xử lý...",
          text: "Vui lòng chờ trong giây lát",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        if (person.isSpouse) {
          removeSpouse(userWalletAddress, clanItem?.clanId, person.spouseId, person.id, callBack, handleErr);
        } else {
          removeChild(userWalletAddress, clanItem?.clanId, person.id, callBack, handleErr);
        }
      }
    });
  };

  const callBack = () => {
    onClose();
    Swal.fire("Đã xóa!", "Thành viên đã được loại bỏ khỏi gia phả.", "success");
    fetchDataDialog();
  };

  const handleErr = (title, error) => {
    onClose();
    sweetalert2.popupAlert({ title, text: error });
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % personDetail?.allImageUrls.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + personDetail?.allImageUrls.length) % personDetail?.allImageUrls.length);
  };

  return (
    <div
      style={{ width: `${width}px` }}
      className="fixed top-0 right-0 h-full bg-[#fdf8e9] border-l-4 border-[#5d3a1a] shadow-2xl z-[50] flex flex-col transition-[width] duration-68 ease-out"
    >
      {currentIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setCurrentIndex(null)}
        >
          {/* Nút Đóng */}
          <button className="absolute top-6 right-6 text-white/70 hover:text-white z-[110]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Nút Trước (<) */}
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Ảnh hiển thị */}
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img
              src={personDetail?.allImageUrls[currentIndex]}
              className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in duration-300"
              alt="Full view"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 font-sans text-sm tracking-widest">
              {currentIndex + 1} / {personDetail?.allImageUrls?.length}
            </div>
          </div>

          {/* Nút Tiếp Theo (>) */}
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
      {/* THANH NẮM ĐỂ KÉO (Resizer Handle) */}
      <div
        onMouseDown={startResizing}
        className="absolute left-[-4px] top-0 w-2 h-full cursor-col-resize hover:bg-[#8b5a2b]/30 transition-colors z-[60]"
        title="Kéo để thay đổi kích thước"
      />
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {isProcessing ? (
          <>
            {userWalletAddress && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3d2611]"></div>
            )}
          </>
        ) : (
          <>
            {(owner === userWalletAddress ||
                clanItem?.clanOwner == userWalletAddress) && (
              <div className="absolute top-4 left-4 z-[70]">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 bg-[#8b5a2b] text-[#f2e2ba] px-3 py-1.5 rounded shadow-md hover:bg-[#5d3a1a] transition-all text-xs font-bold uppercase"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                  Tùy chọn
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[65]"
                      onClick={() => setIsMenuOpen(false)}
                    />

                    <div className="absolute left-0 mt-2 w-56 bg-white border border-[#8b5a2b]/20 shadow-xl rounded-md overflow-hidden animate-in fade-in zoom-in duration-200 z-[70]">
                      {/* Nhóm: Thêm mới */}
                      {!person.isSpouse && (
                        <>
                          <div className="bg-[#fdf8e9]/50 px-3 py-1 text-[10px] font-bold text-[#8b5a2b] uppercase border-b border-[#8b5a2b]/10">
                            Thêm thành viên
                          </div>
                          <button
                            onClick={() => {
                              setModalAddChildState(true);
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2"
                          >
                            <span className="text-lg">+</span> Thêm con cái
                          </button>

                          {person.gender === "male" ? (
                            <button
                              onClick={() => {
                                setModalState({
                                  isOpen: true,
                                  type: "spouse",
                                  targetId: person.id,
                                });
                                setIsMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2"
                            >
                              <span className="text-lg">+</span> Thêm Phu nhân
                              (Vợ)
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setModalState({
                                  isOpen: true,
                                  type: "spouse",
                                  targetId: person.id,
                                });
                                setIsMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2"
                            >
                              <span className="text-lg">+</span> Thêm Phu Quân
                              (Chồng)
                            </button>
                          )}
                        </>
                      )}

                      {/* Nhóm: Chỉnh sửa */}
                      <div className="bg-[#fdf8e9]/50 px-3 py-1 text-[10px] font-bold text-[#8b5a2b] uppercase border-y border-[#8b5a2b]/10">
                        Quản lý
                      </div>

                      <button
                        onClick={() => {
                          // Logic mở modal cập nhật của bạn ở đây
                          // console.log("Mở modal cập nhật cho:", person.id);
                          setIsMenuOpen(false);
                          setModalUpdateState(true);
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Cập nhật thông tin
                      </button>
                      {!person?.hasChildren && person?.id != ANCESTOR_ID && (
                        <button
                          onClick={() => {
                            // if (
                            //   window.confirm(
                            //     `Bạn có chắc chắn muốn xóa ${person.name} khỏi gia phả? Hành động này không thể hoàn tác.`,
                            //   )
                            // ) {
                            //   // Logic xóa của bạn ở đây
                            //   console.log("Xóa thành viên:", person.id);
                            // }
                            handleDelete();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Xóa khỏi gia phả
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b5a2b] hover:text-[#3d2611] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {person && (
          <div className="p-8 h-full flex flex-col">
            <div className="flex-grow overflow-y-auto pr-2">
              {/* Breadcrumb huyết thống */}
              {familyData && !person.isSpouse && (() => {
                const chain = buildAncestryChain(person.id, familyData);
                if (chain.length <= 1) return null;
                const maxShow = 3;
                const truncated = chain.length > maxShow + 1;
                const visible = truncated
                  ? [chain[0], null, ...chain.slice(-(maxShow))]
                  : chain;
                return (
                  <div className="flex items-center flex-wrap gap-1 mb-6 text-[10px] text-[#8b5a2b]/60 font-semibold">
                    {visible.map((p, i) =>
                      p === null ? (
                        <span key="ellipsis" className="opacity-40">···</span>
                      ) : (
                        <span key={p.id} className="flex items-center gap-1">
                          {i > 0 && <span className="opacity-30">›</span>}
                          <span className={p.id === person.id ? "text-[#3d2611] font-black" : ""}>
                            {p.name}
                          </span>
                        </span>
                      )
                    )}
                  </div>
                );
              })()}
              <div className="flex flex-col items-center mb-8">
                <div
                  className="w-28 h-28 rounded-full border-4 border-[#8b5a2b]/30 flex items-center justify-center mb-4 shadow-inner overflow-hidden"
                  style={{ backgroundColor: person.gender === "male" ? "#5d3a1a" : "#c4956a" }}
                >
                  {personDetail?.allImageUrls && personDetail.allImageUrls.length > 0 ? (
                    <img src={personDetail.allImageUrls[0]} alt={person.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg width="52" height="52" fill="none" stroke="#f2e2ba" strokeWidth="1.4" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/>
                    </svg>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#8b5a2b] uppercase tracking-[0.3em] mb-1 font-bold">
                    {person.isSpouse
                      ? (person.gender === "male" ? "Phu quân · Hôn phối" : "Phu nhân · Hôn phối")
                      : (person.gender === "male" ? "Thành viên Nam" : "Thành viên Nữ")}
                  </p>
                  <h2 className="text-2xl font-bold text-[#3d2611] uppercase tracking-tight mb-2">
                    {person.name}
                  </h2>
                  {person.generation && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5d3a1a]/10 border border-[#5d3a1a]/20">
                      <span className="w-4 h-4 bg-[#5d3a1a] flex items-center justify-center text-[#f2e2ba] text-[9px] font-black shrink-0">
                        {person.generation}
                      </span>
                      <span className="text-[10px] font-black text-[#5d3a1a] uppercase tracking-wider">
                        {GENERATION_LABELS[person.generation] || `Đời thứ ${person.generation}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                    Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                      <p className="text-[10px] text-[#8b5a2b] uppercase">Năm sinh</p>
                      <p className="font-bold text-[#3d2611]">{formatDate(person.birthDate)}</p>
                    </div>
                    <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                      <p className="text-[10px] text-[#8b5a2b] uppercase">Năm mất</p>
                      <p className="font-bold text-[#3d2611]">{formatDate(person.deathDate)}</p>
                    </div>
                  </div>
                  {!person.isAlive && person.deathDate?.month > 0 && person.deathDate?.day > 0 && (
                    <div className="mt-3 flex items-center gap-3 px-3 py-2.5 bg-[#3d2611]/5 border border-[#5d3a1a]/20">
                      <svg width="15" height="15" fill="none" stroke="#8b5a2b" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M12 2c0 0-4 3-4 7a4 4 0 0 0 8 0c0-4-4-7-4-7z"/>
                        <path d="M12 13v9M9 22h6"/>
                      </svg>
                      <div>
                        <p className="text-[10px] text-[#8b5a2b] uppercase font-bold tracking-wider">Ngày giỗ (dương lịch)</p>
                        <p className="font-black text-[#3d2611] text-sm">
                          {String(person.deathDate.day).padStart(2, "0")}/{String(person.deathDate.month).padStart(2, "0")} hàng năm
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {!person.isSpouse && person.spouses?.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                      Hôn phối ({person.spouses.length})
                    </h3>
                    <div className="space-y-2">
                      {person.spouses.map((sp, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 bg-white/50 border border-[#8b5a2b]/10">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: sp.gender === "male" ? "#5d3a1a" : "#c4956a" }}
                          >
                            <svg width="16" height="16" fill="none" stroke="#f2e2ba" strokeWidth="1.5" viewBox="0 0 24 24">
                              <circle cx="12" cy="8" r="3"/>
                              <path d="M4 20c0-3 3.1-5 8-5s8 2 8 5"/>
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#3d2611] text-sm uppercase truncate">{sp.name}</p>
                            <p className="text-[10px] text-[#8b5a2b]/60 font-semibold">
                              {sp.gender === "male" ? "Phu quân" : "Phu nhân"}
                              {sp.birthDate?.year ? ` · ${formatDate(sp.birthDate)}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {person.shortDesc && (
                  <section>
                    <div className="flex items-center justify-between border-b border-[#8b5a2b]/20 pb-1 mb-3">
                      <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest">
                        Thông tin sơ lược
                      </h3>
                    </div>

                    <div className="relative">
                      <span className="absolute top-0 left-0 text-4xl text-[#8b5a2b]/20 font-serif">
                        “
                      </span>
                      <p className="text-[#3d2611] italic leading-relaxed pt-4 px-4 text-sm">
                        {person.shortDesc ||
                          "Chưa có dữ liệu tiểu sử ghi chép cho thành viên này."}
                      </p>
                      <span className="absolute bottom-0 right-0 text-4xl text-[#8b5a2b]/20 font-serif">
                        ”
                      </span>
                    </div>
                  </section>
                )}

                {isGettingMetadata ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5a2b]"></div>
                  </div>
                ) : (
                  <>
                    <section>
                        <div className="flex items-center justify-between border-b border-[#8b5a2b]/20 pb-1 mb-3">
                        <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest">
                          Thông tin Tiểu sử
                        </h3>
                        {owner === userWalletAddress && (
                          <a
                            href={`https://universaleverything.io/asset/${clanItem.clanId}/tokenId/${person.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex border border-[#8b5a2b]/15 size-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-[#5d3a1a]/8 text-[#5d3a1a]"
                            title="Cập nhật thông tin chi tiết trên Blockchain"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9.2 17.5L18.6 8.1c.4-.4.4-1 0-1.4l-2-2c-.4-.4-1-.4-1.4 0L5.8 14.1c-.1.1-.2.4-.2.6l-.5 2.5c-.1.7.5 1.3 1.2 1.2l2.5-.5c.2 0 .3-.1.4-.2z"/>
                              <path d="M13.3 6.3l3.4 3.4"/>
                            </svg>
                          </a>
                        )}
                      </div>

                      <div className="relative">
                        <span className="absolute top-0 left-0 text-4xl text-[#8b5a2b]/20 font-serif">
                          “
                        </span>
                        <p className="text-[#3d2611] italic leading-relaxed pt-4 px-4 text-sm">
                          {personDetail?.description ||
                            "Chưa có dữ liệu tiểu sử ghi chép cho thành viên này."}
                        </p>
                        <span className="absolute bottom-0 right-0 text-4xl text-[#8b5a2b]/20 font-serif">
                          ”
                        </span>
                      </div>
                    </section>

                    {personDetail?.allImageUrls?.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                          Bộ sưu tập hình ảnh ({personDetail.allImageUrls.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {personDetail.allImageUrls.map((img, index) => (
                            <div
                              key={index}
                              className="h-36 overflow-hidden border-2 border-[#5d3a1a] shadow-md group cursor-pointer"
                              onClick={() => setCurrentIndex(index)}
                            >
                              <img
                                src={img}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                alt={`gallery-${index}`}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        )}

        {modalState.isOpen && (
          <AddSpouseModal
            onClose={() => setModalState({ isOpen: false, type: null, targetId: null })}
            person={person}
            clanItem={clanItem}
            type={modalState.type}
            fetchDataDialog={fetchDataDialog}
          />
        )}

        {modalAddChildState && (
          <AddChildModal
            onClose={() => setModalAddChildState(false)}
            person={person}
            clanItem={clanItem}
            type={modalState.type}
            fetchDataDialog={fetchDataDialog}
          />
        )}
        {modalUpdateState && (
          <UpdateMemberModal
            onClose={() => setModalUpdateState(false)}
            person={person}
            clanItem={clanItem}
            fetchDataDialog={fetchDataDialog}
          />
        )}
      </div>
    </div>
  );
}
