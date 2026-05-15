"use client";
import React, { useState, useMemo } from "react";
import images from "@/app/img";
import UpdateClanShortDescModal from "@/components/ui/UpdateClanShortDescModal";
import { useSelector } from "react-redux";
import { useBannerCanvas } from "@/hooks/useBannerCanvas";

const GENERATION_LABELS = {
  1: "Tiên tổ", 2: "Nhị đại tôn", 3: "Tam đại tôn", 4: "Tứ đại tôn",
  5: "Ngũ đại tôn", 6: "Lục đại tôn", 7: "Thất đại tôn", 8: "Bát đại tôn",
  9: "Cửu đại tôn", 10: "Thập đại tôn",
};

const STAT_COLORS = [
  { bg: "#5d3a1a", fg: "#f2e2ba", key: "bloodlineMale", label: "Nam huyết thống" },
  { bg: "#8b5a2b", fg: "#f2e2ba", key: "spouseMale",    label: "Rể" },
  { bg: "#c4956a", fg: "#3d2611", key: "bloodlineFemale", label: "Nữ huyết thống" },
  { bg: "#e8c99a", fg: "#5d3a1a", key: "spouseFemale",  label: "Dâu" },
];

export default function GenealogyDetailForm({
  clanItem,
  setTabIndex,
  fetchDataDetail,
  familyData,
  loadingClanDialog,
}) {
  const [currentIndex, setCurrentIndex] = useState(null);
  const [modalUpdateState, setModalUpdateState] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const anniversaryList = useMemo(() => {
    if (!familyData || familyData.length === 0) return [];

    const ancestor = familyData.find((p) => Number(p.generation) === 1 && !p.isSpouse);
    const ancestorId = ancestor?.id;

    const all = [
      ...familyData,
      ...familyData.flatMap((p) => p.spouses || []),
    ].filter(
      (p) => !p.isAlive && p.deathDate?.month > 0 && p.deathDate?.day > 0
    ).map((p) => ({ ...p, _isAncestor: p.id === ancestorId }));

    const byMonth = {};
    all.forEach((p) => {
      const m = p.deathDate.month;
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(p);
    });

    // Trong mỗi tháng: Tiên tổ luôn đứng đầu, sau đó sắp xếp theo ngày
    Object.values(byMonth).forEach((arr) =>
      arr.sort((a, b) => {
        if (a._isAncestor) return -1;
        if (b._isAncestor) return 1;
        return a.deathDate.day - b.deathDate.day;
      })
    );

    const ancestorMonth = ancestor?.deathDate?.year > 0 && ancestor?.deathDate?.month > 0 && ancestor?.deathDate?.day > 0
      ? ancestor.deathDate.month
      : null;

    // Tháng của Tiên tổ luôn đứng đầu, sau đó sắp theo tháng gần nhất
    const months = Object.keys(byMonth)
      .map(Number)
      .sort((a, b) => {
        if (ancestorMonth !== null) {
          if (a === ancestorMonth) return -1;
          if (b === ancestorMonth) return 1;
        }
        return ((a - currentMonth + 12) % 12) - ((b - currentMonth + 12) % 12);
      });

    return months.map((m) => ({ month: m, members: byMonth[m] }));
  }, [familyData]);

  const clanStats = useMemo(() => {
    if (!familyData || familyData.length === 0) return null;

    const byGen = {};
    let maleBloodline = 0, femaleBloodline = 0, totalSpouses = 0;

    familyData.forEach((person) => {
      const gen = Number(person.generation) || 1;
      if (!byGen[gen]) byGen[gen] = { bloodlineMale: 0, bloodlineFemale: 0, spouseMale: 0, spouseFemale: 0 };

      if (person.gender === "male") { byGen[gen].bloodlineMale++; maleBloodline++; }
      else { byGen[gen].bloodlineFemale++; femaleBloodline++; }

      (person.spouses || []).forEach((sp) => {
        if (sp.gender === "male") byGen[gen].spouseMale++;
        else byGen[gen].spouseFemale++;
        totalSpouses++;
      });
    });

    const generations = Object.keys(byGen).map(Number).sort((a, b) => a - b);
    const maxRowTotal = Math.max(...generations.map((g) => {
      const d = byGen[g];
      return d.bloodlineMale + d.bloodlineFemale + d.spouseMale + d.spouseFemale;
    }));

    return {
      totalMembers: familyData.length + totalSpouses,
      totalBloodline: familyData.length,
      totalGenerations: generations.length,
      maleBloodline,
      femaleBloodline,
      totalSpouses,
      byGen,
      generations,
      maxRowTotal,
    };
  }, [familyData]);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const bannerSrc =
    typeof images.banner === "string" ? images.banner : images.banner?.src;
  const bannerDataUrl = useBannerCanvas(bannerSrc, clanItem?.clanName);

  const isOwner =
    userWalletAddress && clanItem?.clanOwner === userWalletAddress;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % clanItem?.allImageUrls.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) =>
        (prev - 1 + clanItem?.allImageUrls.length) %
        clanItem?.allImageUrls.length,
    );
  };

  return (
    <div className="h-full w-full bg-[#e8d5b5] font-serif overflow-y-auto pb-20">
      {/* LIGHTBOX */}
      {currentIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setCurrentIndex(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white z-[110]">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img
              src={clanItem?.allImageUrls[currentIndex]}
              className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in duration-300"
              alt="Full view"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 font-sans text-sm tracking-widest">
              {currentIndex + 1} / {clanItem?.allImageUrls.length}
            </div>
          </div>
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* BANNER */}
      <div
        className="w-full border-b-4 border-[#5d3a1a] flex justify-center"
        style={{ backgroundColor: "#e8d5b5" }}
      >
        {bannerDataUrl ? (
          <img
            src={bannerDataUrl}
            alt={clanItem?.clanName ?? "Banner"}
            className="w-full h-auto block"
            style={{ maxWidth: "600px" }}
          />
        ) : (
          <div
            className="w-full max-w-2xl animate-pulse bg-[#d4c4a0]"
            style={{ paddingTop: "44%" }}
          />
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-6 mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left col: Main content */}
        <div className="order-last md:order-first md:col-span-2 space-y-10">
          {/* Tóm lược */}
          <section>
            <div className="flex items-center justify-between border-b-2 border-[#5d3a1a] pb-2 mb-4">
              <h2 className="text-xl font-bold text-[#3d2611] uppercase tracking-widest">
                Tóm lược
              </h2>
              {isOwner && (
                <button
                  className="flex border border-[#8b5a2b]/15 size-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-[#5d3a1a]/8 text-[#5d3a1a]"
                  title="Cập nhật thông tin sơ lược"
                  onClick={() => setModalUpdateState(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.2 17.5L18.6 8.1c.4-.4.4-1 0-1.4l-2-2c-.4-.4-1-.4-1.4 0L5.8 14.1c-.1.1-.2.4-.2.6l-.5 2.5c-.1.7.5 1.3 1.2 1.2l2.5-.5c.2 0 .3-.1.4-.2z"/>
                    <path d="M13.3 6.3l3.4 3.4"/>
                  </svg>
                </button>
              )}
            </div>
            <p className="text-[#5d3a1a] text-base italic leading-relaxed">
              {clanItem?.shortDesc || (
                <span className="opacity-50">Chưa có thông tin sơ lược.</span>
              )}
            </p>
          </section>

          {/* Lịch sử dòng tộc */}
          <section>
            <div className="flex items-center justify-between border-b-2 border-[#5d3a1a] pb-2 mb-4">
              <h2 className="text-xl font-bold text-[#3d2611] uppercase tracking-widest">
                Lịch sử dòng tộc
              </h2>
              {isOwner && (
                <a
                  href={`https://universaleverything.io/collection/${clanItem?.clanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex border border-[#8b5a2b]/15 size-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-[#5d3a1a]/8 text-[#5d3a1a]"
                  title="Cập nhật lịch sử dòng tộc"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.2 17.5L18.6 8.1c.4-.4.4-1 0-1.4l-2-2c-.4-.4-1-.4-1.4 0L5.8 14.1c-.1.1-.2.4-.2.6l-.5 2.5c-.1.7.5 1.3 1.2 1.2l2.5-.5c.2 0 .3-.1.4-.2z"/>
                    <path d="M13.3 6.3l3.4 3.4"/>
                  </svg>
                </a>
              )}
            </div>
            <div className="text-[#3d2611] text-base leading-loose whitespace-pre-line text-justify">
              {clanItem?.clanDetail || (
                <span className="italic text-[#5d3a1a]/50">Chưa có lịch sử dòng tộc. Hãy cập nhật qua nền tảng Universal Everything.</span>
              )}
            </div>
          </section>

          {/* Thống kê dòng tộc */}
          <section>
            <div className="flex items-center justify-between border-b-2 border-[#5d3a1a] pb-2 mb-6">
              <h2 className="text-xl font-bold text-[#3d2611] uppercase tracking-widest">
                Thống kê dòng tộc
              </h2>
            </div>

            {loadingClanDialog ? (
              <div className="space-y-3 animate-pulse">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-[#5d3a1a]/8 rounded" />
                  ))}
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-[#5d3a1a]/5 rounded" />
                ))}
              </div>
            ) : !clanStats ? (
              <p className="text-[#5d3a1a]/50 italic text-sm">Chưa có dữ liệu thành viên.</p>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {[
                    { value: clanStats.totalMembers, label: "Tổng thành viên", dark: true },
                    { value: clanStats.totalGenerations, label: "Số đời", dark: false },
                    { value: clanStats.maleBloodline, label: "Nam huyết thống", dark: false },
                    { value: clanStats.femaleBloodline, label: "Nữ huyết thống", dark: false },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className={`p-4 text-center shadow-[4px_4px_0px_rgba(61,38,17,0.12)] ${
                        card.dark
                          ? "bg-[#3d2611] text-[#f2e2ba]"
                          : "bg-[#f2e2ba] border-2 border-[#5d3a1a]/20 text-[#3d2611]"
                      }`}
                    >
                      <div className="text-3xl font-black leading-none mb-1">{card.value}</div>
                      <div className={`text-[10px] uppercase tracking-widest font-semibold ${card.dark ? "opacity-55" : "text-[#5d3a1a]/55"}`}>
                        {card.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phân bố theo đời */}
                <div className="mb-2">
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-xs font-black text-[#3d2611] uppercase tracking-widest whitespace-nowrap">
                      Phân bố theo đời
                    </p>
                    <div className="flex-1 h-px bg-[#5d3a1a]/10" />
                  </div>

                  <div className="space-y-2.5">
                    {clanStats.generations.map((gen) => {
                      const d = clanStats.byGen[gen];
                      const label = GENERATION_LABELS[gen] || `Đời thứ ${gen}`;
                      const rowTotal = d.bloodlineMale + d.bloodlineFemale + d.spouseMale + d.spouseFemale;
                      const trackPct = (rowTotal / clanStats.maxRowTotal) * 100;
                      const segments = STAT_COLORS.map((c) => ({ ...c, count: d[c.key] })).filter((s) => s.count > 0);

                      return (
                        <div
                          key={gen}
                          className="border border-[#5d3a1a]/12 bg-[#f2e2ba]/50 p-4 hover:bg-[#f2e2ba]/80 transition-colors duration-150"
                        >
                          {/* Row header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-[#5d3a1a] flex items-center justify-center text-[#f2e2ba] text-[11px] font-black shrink-0">
                                {gen}
                              </div>
                              <div>
                                <div className="text-xs font-black text-[#3d2611] uppercase tracking-wider">{label}</div>
                                <div className="text-[10px] text-[#5d3a1a]/50 mt-0.5">
                                  {d.bloodlineMale + d.bloodlineFemale} huyết thống
                                  {d.spouseMale + d.spouseFemale > 0 && ` · ${d.spouseMale + d.spouseFemale} dâu/rể`}
                                </div>
                              </div>
                            </div>
                            <span className="text-xl font-black text-[#3d2611]/20 tabular-nums">{rowTotal}</span>
                          </div>

                          {/* Stacked bar — outer track width proportional to row size */}
                          <div className="h-6 bg-[#5d3a1a]/5 overflow-hidden mb-2.5">
                            <div className="h-full flex gap-px" style={{ width: `${trackPct}%` }}>
                              {segments.map((seg, si) => {
                                const segPct = (seg.count / rowTotal) * 100;
                                return (
                                  <div
                                    key={si}
                                    className="flex items-center justify-center text-[10px] font-black overflow-hidden transition-all"
                                    style={{
                                      backgroundColor: seg.bg,
                                      color: seg.fg,
                                      width: `${segPct}%`,
                                      minWidth: "22px",
                                    }}
                                    title={`${seg.label}: ${seg.count}`}
                                  >
                                    {segPct >= 15 ? seg.count : ""}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Pills */}
                          <div className="flex flex-wrap gap-3">
                            {segments.map((seg, si) => (
                              <span key={si} className="flex items-center gap-1.5 text-[10px] text-[#5d3a1a]/70 font-semibold">
                                <span className="w-2 h-2 rounded-sm inline-block shrink-0" style={{ backgroundColor: seg.bg }} />
                                {seg.count} {seg.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-[#5d3a1a]/10 flex flex-wrap gap-x-5 gap-y-2">
                  {STAT_COLORS.map((c, i) => (
                    <span key={i} className="flex items-center gap-2 text-[11px] text-[#5d3a1a]/55 font-semibold">
                      <span className="w-3 h-3 inline-block shrink-0" style={{ backgroundColor: c.bg }} />
                      {c.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Ngày giỗ dòng tộc */}
          <section>
            <div className="flex items-center justify-between border-b-2 border-[#5d3a1a] pb-2 mb-6">
              <h2 className="text-xl font-bold text-[#3d2611] uppercase tracking-widest">
                Ngày giỗ dòng tộc
              </h2>
              {!loadingClanDialog && anniversaryList.length > 0 && (
                <span className="text-[10px] font-black text-[#5d3a1a]/40 uppercase tracking-widest">
                  {anniversaryList.reduce((s, g) => s + g.members.length, 0)} người
                </span>
              )}
            </div>

            {loadingClanDialog ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i}>
                    <div className="h-5 w-24 bg-[#5d3a1a]/10 mb-2" />
                    <div className="space-y-2">
                      {[1, 2].map((j) => <div key={j} className="h-14 bg-[#5d3a1a]/5" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : anniversaryList.length === 0 ? (
              <p className="text-[#5d3a1a]/50 italic text-sm">
                Chưa có thành viên nào có đầy đủ thông tin ngày mất để tổng hợp.
              </p>
            ) : (
              <div className="space-y-6">
                {anniversaryList.map(({ month, members }) => {
                  const isCurrentMonth = month === currentMonth;
                  return (
                    <div key={month}>
                      {/* Month header */}
                      <div className={`flex items-center gap-3 mb-3 ${isCurrentMonth ? "" : ""}`}>
                        <div className={`flex items-center gap-2 px-3 py-1.5 ${isCurrentMonth ? "bg-[#3d2611] text-[#f2e2ba]" : "bg-[#5d3a1a]/10 text-[#5d3a1a]"}`}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 2c0 0-4 3-4 7a4 4 0 0 0 8 0c0-4-4-7-4-7z"/>
                            <path d="M12 13v9M9 22h6"/>
                          </svg>
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            Tháng {month}
                          </span>
                          {isCurrentMonth && (
                            <span className="text-[9px] font-black bg-[#f2e2ba]/20 px-1.5 py-0.5 tracking-wider">
                              THÁNG NÀY
                            </span>
                          )}
                        </div>
                        <div className="flex-1 h-px bg-[#5d3a1a]/10" />
                        <span className="text-[10px] text-[#5d3a1a]/40 font-semibold">{members.length} ngày giỗ</span>
                      </div>

                      {/* Members list */}
                      <div className="space-y-2">
                        {members.map((p, i) => {
                          const role = p.isSpouse
                            ? (p.gender === "male" ? "Phu quân" : "Phu nhân")
                            : (GENERATION_LABELS[p.generation] || `Đời thứ ${p.generation}`);
                          const yearsSince = currentYear - p.deathDate.year;
                          const isThisMonth = month === currentMonth;

                          if (p._isAncestor) {
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-4 px-4 py-3 bg-[#3d2611] border-2 border-[#3d2611]"
                              >
                                {/* Day badge */}
                                <div className="w-10 h-10 flex flex-col items-center justify-center shrink-0 bg-[#f2e2ba]/15">
                                  <span className="text-base font-black leading-none text-[#f2e2ba]">
                                    {String(p.deathDate.day).padStart(2, "0")}
                                  </span>
                                  <span className="text-[8px] font-black text-[#f2e2ba]/50 uppercase">
                                    th.{month}
                                  </span>
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[9px] font-black bg-[#f2e2ba]/15 text-[#f2e2ba]/70 px-1.5 py-0.5 uppercase tracking-widest shrink-0">
                                      NGÀY GIỖ TỔ
                                    </span>
                                  </div>
                                  <p className="font-black text-[#f2e2ba] uppercase tracking-tight truncate text-sm">
                                    {p.name}
                                  </p>
                                  <p className="text-[10px] text-[#f2e2ba]/45 font-semibold">
                                    Tiên tổ
                                    {yearsSince > 0 && (
                                      <span className="ml-2">· {p.deathDate.year} ({yearsSince} năm)</span>
                                    )}
                                  </p>
                                </div>
                                <svg width="14" height="14" fill="none" stroke="#c4956a" strokeWidth="1.8" viewBox="0 0 24 24">
                                  <path d="M12 2c0 0-4 3-4 7a4 4 0 0 0 8 0c0-4-4-7-4-7z"/>
                                  <path d="M12 13v9M9 22h6"/>
                                </svg>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-4 px-4 py-3 border transition-colors ${
                                isThisMonth
                                  ? "bg-[#3d2611]/5 border-[#5d3a1a]/30 hover:bg-[#3d2611]/8"
                                  : "bg-[#f2e2ba]/40 border-[#5d3a1a]/10 hover:bg-[#f2e2ba]/70"
                              }`}
                            >
                              {/* Day badge */}
                              <div className={`w-10 h-10 flex flex-col items-center justify-center shrink-0 ${isThisMonth ? "bg-[#3d2611] text-[#f2e2ba]" : "bg-[#5d3a1a]/10 text-[#3d2611]"}`}>
                                <span className="text-base font-black leading-none">
                                  {String(p.deathDate.day).padStart(2, "0")}
                                </span>
                                <span className="text-[8px] font-black opacity-60 uppercase">
                                  th.{month}
                                </span>
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-[#3d2611] uppercase tracking-tight truncate text-sm">
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-[#5d3a1a]/55 font-semibold mt-0.5">
                                  {role}
                                  {p.deathDate.year > 0 && (
                                    <span className="ml-2 text-[#5d3a1a]/35">
                                      · {p.deathDate.year} ({yearsSince > 0 ? `${yearsSince} năm trước` : "năm nay"})
                                    </span>
                                  )}
                                </p>
                              </div>
                              {/* Gender dot */}
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: p.gender === "male" ? "#5d3a1a" : "#c4956a" }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Bộ sưu tập hình ảnh */}
          {clanItem?.allImageUrls?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#3d2611] border-b-2 border-[#5d3a1a] pb-2 mb-6 uppercase tracking-widest">
                Bộ sưu tập hình ảnh
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {clanItem.allImageUrls.map((img, index) => (
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
        </div>

        {/* Right col: Sidebar */}
        <div className="order-first md:order-last space-y-5">
          {/* Primary CTA: Phả đồ */}
          <div className="bg-[#3d2611] p-5 shadow-[8px_8px_0px_0px_rgba(61,38,17,0.18)]">
            <p className="text-[#f2e2ba]/60 text-[10px] uppercase tracking-[0.2em] font-black mb-3 text-center">
              Khám phá dòng tộc
            </p>
            <button
              onClick={() => setTabIndex(1)}
              className="w-full py-3.5 bg-[#f2e2ba] text-[#3d2611] font-black rounded-none hover:bg-[#e8d5b5] transition-all flex items-center justify-center gap-2.5 text-sm uppercase tracking-widest shadow-md active:scale-95"
            >
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="3"/>
                <circle cx="5" cy="19" r="3"/>
                <circle cx="19" cy="19" r="3"/>
                <line x1="12" y1="8" x2="5" y2="16"/>
                <line x1="12" y1="8" x2="19" y2="16"/>
              </svg>
              Xem phả đồ
            </button>
          </div>

          {/* Quick stats widget */}
          {clanStats && (
            <div className="bg-[#f2e2ba] border-2 border-[#5d3a1a]/20 p-4 shadow-[4px_4px_0px_rgba(61,38,17,0.08)]">
              <p className="text-[10px] font-black text-[#5d3a1a]/50 uppercase tracking-[0.2em] mb-3 text-center">
                Tổng quan
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { val: clanStats.totalMembers, lbl: "Thành viên" },
                  { val: clanStats.totalGenerations, lbl: "Số đời" },
                  { val: clanStats.maleBloodline, lbl: "Nam h.t." },
                  { val: clanStats.femaleBloodline, lbl: "Nữ h.t." },
                ].map((s, i) => (
                  <div key={i} className="text-center py-2 bg-[#e8d5b5]/60">
                    <div className="text-lg font-black text-[#3d2611]">{s.val}</div>
                    <div className="text-[9px] text-[#5d3a1a]/50 uppercase tracking-wider">{s.lbl}</div>
                  </div>
                ))}
              </div>
              {/* Gender ratio bar */}
              {clanStats.totalBloodline > 0 && (
                <div className="h-1.5 flex overflow-hidden rounded-full">
                  <div className="bg-[#5d3a1a]" style={{ width: `${(clanStats.maleBloodline / clanStats.totalBloodline) * 100}%` }} />
                  <div className="bg-[#c4956a]" style={{ width: `${(clanStats.femaleBloodline / clanStats.totalBloodline) * 100}%` }} />
                </div>
              )}
            </div>
          )}

          {/* Owner actions */}
          {isOwner && (
            <div className="bg-[#f2e2ba] border-2 border-[#5d3a1a] p-5 shadow-[6px_6px_0px_0px_rgba(93,58,26,0.1)]">
              <h3 className="text-[#3d2611] font-black text-[10px] uppercase tracking-[0.2em] border-b border-[#5d3a1a]/20 pb-3 mb-4">
                Quản lý dòng tộc
              </h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => setModalUpdateState(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#5d3a1a] hover:bg-[#5d3a1a]/8 transition-colors text-left"
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9.2 17.5L18.6 8.1c.4-.4.4-1 0-1.4l-2-2c-.4-.4-1-.4-1.4 0L5.8 14.1c-.1.1-.2.4-.2.6l-.5 2.5c-.1.7.5 1.3 1.2 1.2l2.5-.5c.2 0 .3-.1.4-.2z"/>
                    <path d="M13.3 6.3l3.4 3.4"/>
                  </svg>
                  <span className="font-semibold">Cập nhật tóm lược</span>
                </button>
                <a
                  href={`https://universaleverything.io/collection/${clanItem?.clanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#5d3a1a] hover:bg-[#5d3a1a]/8 transition-colors"
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <span className="font-semibold">Cập nhật lịch sử</span>
                </a>
                <button
                  onClick={() => setTabIndex(1)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#5d3a1a] hover:bg-[#5d3a1a]/8 transition-colors text-left"
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3v3M14 17h3"/>
                  </svg>
                  <span className="font-semibold">Tạo mã QR chia sẻ</span>
                </button>
              </div>
            </div>
          )}

          {/* Blockchain verification */}
          <div className="border-2 border-[#5d3a1a]/25 p-4 bg-[#f2e2ba]/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#5d3a1a]/10 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="16" height="16" fill="none" stroke="#5d3a1a" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[#3d2611] font-bold text-xs uppercase tracking-wider mb-1">
                  Xác thực Blockchain
                </p>
                <p className="text-[#5d3a1a]/65 text-xs leading-relaxed mb-2">
                  Hồ sơ này đã được lưu trữ bất biến trên mạng lưới LUKSO.
                </p>
                <a
                  href={`https://explorer.execution.mainnet.lukso.network/address/${clanItem?.clanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#5d3a1a] text-xs font-bold hover:opacity-70 transition-opacity"
                >
                  Xem trên Explorer
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Clan address */}
          <div className="px-3 py-2.5 bg-[#3d2611]/5 border border-[#5d3a1a]/15">
            <p className="text-[10px] text-[#5d3a1a]/50 uppercase tracking-widest font-semibold mb-1">
              Địa chỉ dòng tộc
            </p>
            <p className="text-[#5d3a1a] text-xs font-mono break-all leading-relaxed">
              {clanItem?.clanId}
            </p>
          </div>
        </div>
      </div>

      {modalUpdateState && (
        <UpdateClanShortDescModal
          onClose={() => setModalUpdateState(false)}
          clanItem={clanItem}
          fetchDataDetail={fetchDataDetail}
        />
      )}
    </div>
  );
}
