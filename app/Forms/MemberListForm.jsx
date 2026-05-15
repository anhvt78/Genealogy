"use client";
import React, { useMemo, useState } from "react";
import { formatDate } from "@/components/Utils/helpers";

const GENERATION_LABELS = {
  1: "Tiên tổ", 2: "Nhị đại tôn", 3: "Tam đại tôn", 4: "Tứ đại tôn",
  5: "Ngũ đại tôn", 6: "Lục đại tôn", 7: "Thất đại tôn", 8: "Bát đại tôn",
  9: "Cửu đại tôn", 10: "Thập đại tôn",
};

const SELECT_CLS = "py-2 px-3 bg-white/60 border border-[#5d3a1a]/20 text-xs text-[#3d2611] outline-none focus:border-[#5d3a1a]/50 font-semibold cursor-pointer";

export default function MemberListForm({ familyData, loadingClanDialog, onSelectMember }) {
  const [search, setSearch] = useState("");
  const [filterGen, setFilterGen] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { allMembers, generations } = useMemo(() => {
    if (!familyData) return { allMembers: [], generations: [] };
    const all = [
      ...familyData,
      ...familyData.flatMap((p) => p.spouses || []),
    ].sort((a, b) => {
      if (a.generation !== b.generation) return a.generation - b.generation;
      if (!!a.isSpouse !== !!b.isSpouse) return a.isSpouse ? 1 : -1;
      return (a.name || "").localeCompare(b.name || "", "vi");
    });
    const gens = [...new Set(familyData.map((p) => p.generation))].sort((a, b) => a - b);
    return { allMembers: all, generations: gens };
  }, [familyData]);

  const filtered = useMemo(() => {
    return allMembers.filter((p) => {
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterGen !== "all" && String(p.generation) !== filterGen) return false;
      if (filterGender !== "all" && p.gender !== filterGender) return false;
      if (filterStatus === "alive" && p.isAlive !== true) return false;
      if (filterStatus === "deceased" && p.isAlive !== false) return false;
      if (filterStatus === "unknown" && p.isAlive !== undefined) return false;
      return true;
    });
  }, [allMembers, search, filterGen, filterGender, filterStatus]);

  if (loadingClanDialog) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-[#5d3a1a]/50 font-serif">
        <div className="w-6 h-6 border-2 border-[#5d3a1a]/30 border-t-[#5d3a1a] rounded-full animate-spin" />
        <p className="text-sm italic animate-pulse">Đang tải danh sách thành viên...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#e8d5b5] font-serif overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 px-6 py-3 bg-[#e8d5b5] border-b-2 border-[#5d3a1a]/15 flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5d3a1a]/35" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên..."
            className="w-full pl-8 pr-4 py-2 bg-white/60 border border-[#5d3a1a]/20 text-xs text-[#3d2611] placeholder-[#5d3a1a]/35 outline-none focus:border-[#5d3a1a]/50 focus:bg-white transition-colors font-semibold"
          />
        </div>

        <select value={filterGen} onChange={(e) => setFilterGen(e.target.value)} className={SELECT_CLS}>
          <option value="all">Tất cả đời</option>
          {generations.map((g) => (
            <option key={g} value={String(g)}>Đời {g} · {GENERATION_LABELS[g] || `Đời thứ ${g}`}</option>
          ))}
        </select>

        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className={SELECT_CLS}>
          <option value="all">Tất cả giới</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SELECT_CLS}>
          <option value="all">Tất cả trạng thái</option>
          <option value="alive">Còn sống</option>
          <option value="deceased">Đã mất</option>
          <option value="unknown">Chưa xác định</option>
        </select>

        <span className="text-[10px] text-[#5d3a1a]/40 font-black uppercase tracking-widest ml-auto">
          {filtered.length} / {allMembers.length}
        </span>
      </div>

      {/* Table */}
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#5d3a1a]/40 text-sm italic">
            Không tìm thấy thành viên phù hợp.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#3d2611] text-[#f2e2ba]">
                <th className="text-left px-4 py-3 text-[9px] uppercase tracking-widest font-black w-10">#</th>
                <th className="text-left px-4 py-3 text-[9px] uppercase tracking-widest font-black">Họ và tên</th>
                <th className="text-left px-4 py-3 text-[9px] uppercase tracking-widest font-black hidden sm:table-cell">Đời</th>
                <th className="text-left px-4 py-3 text-[9px] uppercase tracking-widest font-black hidden md:table-cell">Vai trò</th>
                <th className="text-left px-4 py-3 text-[9px] uppercase tracking-widest font-black hidden lg:table-cell">Năm sinh</th>
                <th className="text-left px-4 py-3 text-[9px] uppercase tracking-widest font-black hidden lg:table-cell">Năm mất</th>
                <th className="text-center px-4 py-3 text-[9px] uppercase tracking-widest font-black">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const isDeceased = p.isAlive === false;
                const isAlive = p.isAlive === true;
                const role = p.isSpouse
                  ? (p.gender === "male" ? "Phu quân" : "Phu nhân")
                  : (GENERATION_LABELS[p.generation] || `Đời thứ ${p.generation}`);

                return (
                  <tr
                    key={`${p.id}-${i}`}
                    onClick={() => onSelectMember(p)}
                    className={`border-b cursor-pointer transition-colors ${
                      isDeceased
                        ? "bg-[#d6d3ce]/50 hover:bg-[#d6d3ce]/80 border-[#9a9690]/15"
                        : i % 2 === 0
                          ? "bg-[#f2e2ba]/40 hover:bg-[#f2e2ba]/80 border-[#5d3a1a]/8"
                          : "bg-[#e8d5b5]/60 hover:bg-[#e8d5b5] border-[#5d3a1a]/8"
                    }`}
                  >
                    <td className="px-4 py-3 text-[10px] font-mono opacity-30">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isDeceased ? "#9a9690" : p.gender === "male" ? "#5d3a1a" : "#c4956a" }}
                        >
                          <svg width="13" height="13" fill="none" stroke="#f2e2ba" strokeWidth="1.8" viewBox="0 0 24 24">
                            <circle cx="12" cy="8" r="3"/>
                            <path d="M4 20c0-3 3.1-5 8-5s8 2 8 5"/>
                          </svg>
                        </div>
                        <div>
                          <p className={`font-black text-sm uppercase tracking-tight leading-none ${isDeceased ? "text-[#5a5753]" : "text-[#3d2611]"}`}>
                            {p.name}
                          </p>
                          {p.isSpouse && (
                            <p className="text-[9px] text-[#5d3a1a]/40 font-semibold italic mt-0.5">hôn phối</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className={`w-6 h-6 flex items-center justify-center text-[9px] font-black ${isDeceased ? "bg-[#9a9690]/25 text-[#5a5753]" : "bg-[#5d3a1a] text-[#f2e2ba]"}`}>
                        {p.generation}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold hidden md:table-cell" style={{ color: isDeceased ? "#6b6760" : "#5d3a1a", opacity: 0.7 }}>
                      {role}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono hidden lg:table-cell" style={{ color: isDeceased ? "#6b6760" : "#3d2611", opacity: 0.7 }}>
                      {formatDate(p.birthDate)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono hidden lg:table-cell" style={{ color: isDeceased ? "#6b6760" : "#3d2611", opacity: 0.7 }}>
                      {isAlive ? (
                        <span className="flex items-center gap-1 text-green-700/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500/80 inline-block" />
                          nay
                        </span>
                      ) : formatDate(p.deathDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isAlive ? (
                        <span className="text-[9px] font-black text-green-700/70 bg-green-500/10 px-2 py-0.5">SỐNG</span>
                      ) : isDeceased ? (
                        <span className="text-[9px] font-black text-[#6b6760] bg-[#9a9690]/15 px-2 py-0.5">ĐÃ MẤT</span>
                      ) : (
                        <span className="text-[9px] font-black opacity-20">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
