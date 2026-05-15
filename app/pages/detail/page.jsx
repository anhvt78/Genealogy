"use client";
import React, { useContext, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GenealogyDetailForm from "@/app/Forms/GenealogyDetailForm";
import GenealogyDiagramForm from "@/app/Forms/GenealogyDiagramForm";
import MemberListForm from "@/app/Forms/MemberListForm";
import { useRouter } from "next/navigation";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import {
  generateMetadataLink,
  numberToByte32,
} from "@/components/Utils/helpers";
import Lottie from "lottie-react";
import gettingDataAnimation from "../../assets/animations/gettingData.json";
import TopNav from "@/components/ui/TopNav";

const NONE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const GENDER_MAP = { 0: "male", 1: "female", 2: "undefined" };

function TabBar({ tabIndex, setTabIndex, loadingClanDialog }) {
  const tabs = [
    {
      index: 0,
      label: "Thông tin",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      index: 1,
      label: "Phả đồ",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
          <line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" />
        </svg>
      ),
      loading: loadingClanDialog,
    },
    {
      index: 2,
      label: "Thành viên",
      icon: (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      loading: loadingClanDialog,
    },
  ];

  return (
    <div className="flex border-b-2 border-[#5d3a1a] bg-[#e8d5b5] shrink-0 px-2">
      {tabs.map((tab) => (
        <button
          key={tab.index}
          onClick={() => setTabIndex(tab.index)}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-[2px] ${
            tabIndex === tab.index
              ? "border-[#3d2611] text-[#3d2611]"
              : "border-transparent text-[#5d3a1a]/45 hover:text-[#5d3a1a]"
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.loading && (
            <span className="w-3 h-3 border border-[#5d3a1a] border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      ))}
    </div>
  );
}

function GenealogyDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clanId = searchParams.get("id");

  const [tabIndex, setTabIndex] = useState(0);
  const [familyData, setFamilyData] = useState(null);
  const { getClanDetail, getPersonData } = useContext(GenealogyContext);
  const [clanItem, setClanItem] = useState();
  const [loadingClanDetail, setLoadingClanDetail] = useState(true);
  const [loadingClanDialog, setLoadingClanDialog] = useState(true);
  const [anniversaryMembers, setAnniversaryMembers] = useState([]);
  const [showAnniversaryModal, setShowAnniversaryModal] = useState(false);
  const [previewMember, setPreviewMember] = useState(null);

  // ── Auto-hide nav logic (diagram tab only) ──────────────────────────────
  const [navVisible, setNavVisible] = useState(true);
  const hideTimerRef = useRef(null);

  const scheduleHide = () => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setNavVisible(false), 1800);
  };

  const revealNav = () => {
    clearTimeout(hideTimerRef.current);
    setNavVisible(true);
  };

  // Show nav briefly when entering diagram, then auto-hide
  useEffect(() => {
    if (tabIndex === 1) {
      setNavVisible(true);
      scheduleHide();
    } else {
      clearTimeout(hideTimerRef.current);
      setNavVisible(true);
    }
    return () => clearTimeout(hideTimerRef.current);
  }, [tabIndex]);

  // Detect mouse near top edge to reveal nav (diagram mode only)
  useEffect(() => {
    if (tabIndex !== 1) return;
    const onMouseMove = (e) => {
      if (e.clientY < 16) revealNav();
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [tabIndex]);
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!clanId) {
      setLoadingClanDetail(false);
      setLoadingClanDialog(false);
      return;
    }
    fetchDataDetail();
  }, [clanId]);

  useEffect(() => {
    if (!familyData || familyData.length === 0) return;
    const currentMonth = new Date().getMonth() + 1;
    const members = [
      ...familyData,
      ...familyData.flatMap((p) => p.spouses || []),
    ].filter(
      (p) => !p.isAlive && p.deathDate?.month === currentMonth && p.deathDate?.day > 0
    );
    if (members.length > 0) {
      setAnniversaryMembers(members);
      setShowAnniversaryModal(true);
    }
  }, [familyData]);

  const fetchDataDetail = async () => {
    try {
      const result = await getClanDetail(clanId);
      if (result.sts) {
        fetchDataDialog();
        const object = JSON.parse(result.data?.clanMetadata);
        let allImageUrls = [];
        try {
          const imagesData = object?.value?.LSP4Metadata?.images;
          if (Array.isArray(imagesData)) {
            allImageUrls = imagesData
              .map((subArray) => {
                if (Array.isArray(subArray) && subArray.length > 0)
                  return generateMetadataLink(subArray[0]?.url);
                return null;
              })
              .filter(Boolean);
          }
        } catch {
          router.push("/");
        }

        setClanItem({
          clanId,
          clanName: result.data?.clanName,
          clanOwner: result.data?.clanOwner,
          shortDesc: result.data?.clanDesc,
          allImageUrls,
          clanDetail: object?.value?.LSP4Metadata?.description,
        });
      } else {
        sweetalert2.popupAlert({
          title: "Đã xảy ra lỗi",
          text: "Lỗi khi tải thông tin Gia phả. Vui lòng kiểm tra lại địa chỉ!",
        });
        router.push("/");
      }
    } catch {
      sweetalert2.popupAlert({
        title: "Đã xảy ra lỗi",
        text: "Lỗi khi tải thông tin Gia phả. Vui lòng kiểm tra lại địa chỉ!",
      });
      router.push("/");
    } finally {
      setLoadingClanDetail(false);
    }
  };

  const fetchDataDialog = async () => {
    setLoadingClanDialog(true);
    const ancestorId = numberToByte32(1);
    const tempList = [];

    const traverse = async (personId, generation = 1) => {
      try {
        const result = await getPersonData(clanId, personId);
        if (!result.sts) throw new Error(`Không thể tải dữ liệu cá nhân ID: ${personId}`);

        const data = result.data;
        const spousesDetails = await Promise.all(
          data.spouses.map(async (el) => {
            const spouseResult = await getPersonData(clanId, el);
            if (!spouseResult.sts) throw new Error("Lỗi khi tải thông tin vợ/chồng");
            return {
              id: el,
              name: spouseResult.data.name,
              birthDate: spouseResult.data.birthDate,
              deathDate: spouseResult.data.deathDate,
              shortDesc: spouseResult.data.shortDesc,
              gender: GENDER_MAP[spouseResult.data.sex] || "undefined",
              isSpouse: true,
              spouseId: personId,
              generation,
              createdAt: spouseResult.data.createdAt,
              isAlive: spouseResult.data.isAlive,
            };
          }),
        );

        tempList.push({
          id: personId,
          name: data.name,
          gender: GENDER_MAP[data.sex] || "undefined",
          birthDate: data.birthDate,
          deathDate: data.deathDate,
          shortDesc: data.shortDesc,
          parents: data.parentId !== NONE_ID ? [data.parentId] : [],
          spouses: spousesDetails,
          generation,
          createdAt: data.createdAt,
          isAlive: data.isAlive,
        });

        if (data.children?.length > 0) {
          await Promise.all(data.children.map((childId) => traverse(childId, generation + 1)));
        }
      } catch (err) {
        throw err;
      }
    };

    try {
      await traverse(ancestorId, 1);
      setFamilyData(tempList);
    } catch (error) {
      sweetalert2.popupAlert({
        title: "Lỗi cấu trúc Gia phả",
        text: error.message || "Có lỗi xảy ra trong quá trình truy vấn.",
        icon: "error",
      });
    } finally {
      setLoadingClanDialog(false);
    }
  };

  const isDiagram = tabIndex === 1;

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex flex-col overflow-hidden relative">
      {showAnniversaryModal && (
        <AnniversaryModal
          members={anniversaryMembers}
          onClose={() => setShowAnniversaryModal(false)}
        />
      )}

      {/*
        ── Navigation wrapper ──────────────────────────────────────────────
        Tab 0 (detail) : normal flow → takes up 56+44 = 100px in layout
        Tab 1 (diagram): absolute overlay → diagram fills full screen height,
                         nav slides up/down with translateY on top of canvas
      */}
      <div
        className={`flex-shrink-0 z-50 transition-transform duration-300 ease-in-out ${
          isDiagram
            ? `absolute top-0 left-0 right-0 ${navVisible ? "translate-y-0" : "-translate-y-full"}`
            : ""
        }`}
        onMouseEnter={isDiagram ? revealNav : undefined}
        onMouseLeave={isDiagram ? scheduleHide : undefined}
      >
        <TopNav clanName={clanItem?.clanName} onBack={() => router.push("/")} />
        <TabBar
          tabIndex={tabIndex}
          setTabIndex={setTabIndex}
          loadingClanDialog={loadingClanDialog}
        />
      </div>

      {/* Invisible hover-trigger strip at very top when nav is hidden (diagram mode) */}
      {isDiagram && !navVisible && (
        <div
          className="absolute top-0 left-0 right-0 h-4 z-[49]"
          onMouseEnter={revealNav}
        />
      )}

      {/* Content area */}
      <div className="flex-grow overflow-hidden">
        {tabIndex === 0 && (
          loadingClanDetail
            ? <LoadingState message="Đang truy vấn dữ liệu dòng tộc..." />
            : <GenealogyDetailForm
                clanItem={clanItem}
                setTabIndex={setTabIndex}
                fetchDataDetail={fetchDataDetail}
                familyData={familyData}
                loadingClanDialog={loadingClanDialog}
              />
        )}
        {tabIndex === 1 && (
          loadingClanDialog
            ? <LoadingState message="Đang khởi tạo sơ đồ phả hệ..." />
            : <GenealogyDiagramForm
                clanItem={clanItem}
                familyData={familyData}
                setTabIndex={setTabIndex}
                fetchDataDialog={fetchDataDialog}
                fetchDataDetail={fetchDataDetail}
                previewMember={previewMember}
                onPreviewConsumed={() => setPreviewMember(null)}
              />
        )}
        {tabIndex === 2 && (
          <MemberListForm
            familyData={familyData}
            loadingClanDialog={loadingClanDialog}
            onSelectMember={(member) => {
              setPreviewMember(member);
              setTabIndex(1);
            }}
          />
        )}
      </div>
    </div>
  );
}

function AnniversaryModal({ members, onClose }) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#f2e2ba] border-4 border-[#5d3a1a] w-full max-w-md shadow-[16px_16px_0px_rgba(61,38,17,0.25)] animate-in slide-in-from-bottom md:zoom-in duration-300">
        {/* Header */}
        <div className="bg-[#3d2611] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" fill="none" stroke="#c4956a" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M12 2c0 0-4 3-4 7a4 4 0 0 0 8 0c0-4-4-7-4-7z"/>
              <path d="M12 13v9M9 22h6"/>
            </svg>
            <div>
              <p className="text-[10px] text-[#f2e2ba]/40 uppercase tracking-[0.2em] font-black">Nhắc nhở</p>
              <h3 className="text-[#f2e2ba] font-black uppercase tracking-wider text-sm">
                Ngày giỗ tháng {currentMonth}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#f2e2ba]/40 hover:text-[#f2e2ba] transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
          {members.map((m, i) => {
            const yearsSince = currentYear - (m.deathDate?.year || 0);
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#3d2611]/5 border border-[#5d3a1a]/15">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: m.gender === "male" ? "#5d3a1a" : "#c4956a" }}
                >
                  <svg width="16" height="16" fill="none" stroke="#f2e2ba" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3"/>
                    <path d="M4 20c0-3 3.1-5 8-5s8 2 8 5"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[#3d2611] uppercase text-sm truncate">{m.name}</p>
                  <p className="text-[10px] text-[#5d3a1a]/55 font-semibold">
                    {m.isSpouse ? (m.gender === "male" ? "Phu quân" : "Phu nhân") : (m.gender === "male" ? "Thành viên nam" : "Thành viên nữ")}
                    {yearsSince > 0 && ` · Năm thứ ${yearsSince}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-[#3d2611] leading-none">
                    {String(m.deathDate.day).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-[#5d3a1a]/50 font-semibold">
                    tháng {m.deathDate.month}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#5d3a1a] text-[#f2e2ba] font-black uppercase tracking-widest text-xs hover:bg-[#3d2611] transition-colors active:scale-95"
          >
            Đã biết
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ message }) {
  return (
    <div className="h-full flex flex-col items-center justify-center font-serif">
      <div className="w-44 h-44 mb-2">
        <Lottie animationData={gettingDataAnimation} loop={true} />
      </div>
      <p className="text-[#3d2611] animate-pulse text-lg font-bold tracking-widest uppercase text-center px-4">
        {message}
      </p>
    </div>
  );
}

export default function GenealogyDetail() {
  return (
    <Suspense fallback={<LoadingState message="Đang khởi động..." />}>
      <GenealogyDetailContent />
    </Suspense>
  );
}
