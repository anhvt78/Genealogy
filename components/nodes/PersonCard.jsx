import React from "react";
import { formatDate } from "../Utils/helpers";

export default function PersonCard({ person, subTitle, onNodeSelect }) {
  const isAlive = person.isAlive === true;
  const isDeceased = person.isAlive === false;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onNodeSelect) onNodeSelect(person);
      }}
      className={`min-w-[220px] shadow-2xl transition-all border-2 rounded-sm cursor-pointer overflow-hidden
        ${isDeceased
          ? "bg-[#d6d3ce] border-[#9a9690]/40 hover:border-[#6b6760]"
          : person.gender === "male"
            ? !person.isSpouse
              ? "bg-[#f2e2ba] border-[#8b5a2b]/30 hover:border-[#5d3a1a]"
              : "bg-[#cec19f] border-[#8b5a2b]/30 hover:border-[#5d3a1a]"
            : !person.isSpouse
              ? "bg-[#fdf3df] border-[#d4a373]/30 hover:border-[#8b5a2b]"
              : "bg-[#ffffff] border-[#d4a373]/30 hover:border-[#8b5a2b]"
        }`}
    >
      <div className={`h-0.5 w-full ${isDeceased ? "bg-[#6b6760]/60" : person.gender === "male" ? "bg-[#5d3a1a]/50" : "bg-[#d4a373]/80"}`} />
      <div className={`p-5 flex flex-col items-center font-serif ${isDeceased ? "text-[#5a5753]" : "text-[#3d2611]"}`}>
        <div className="text-[9px] uppercase tracking-[0.2em] mb-1 opacity-60">
          {subTitle}
        </div>
        <div className={`text-lg font-bold pb-1 w-full text-center tracking-tight uppercase border-b ${isDeceased ? "border-[#9a9690]/30" : "border-[#8b5a2b]/40"}`}>
          {person.name || person.label}
        </div>
        <div className="mt-2 flex items-center justify-center h-[32px]">
          <div className={`text-[10px] italic text-center leading-[16px] max-w-[180px] line-clamp-2 overflow-hidden ${isDeceased ? "text-[#6b6760]/70" : "text-[#5d3a1a]/80"}`}>
            {person.shortDesc}
          </div>
        </div>
        <div className="text-[10px] mt-2 opacity-70 font-mono flex items-center justify-center gap-1.5">
          <span>{formatDate(person.birthDate)}</span>
          <span>—</span>
          {isAlive ? (
            <span className="flex items-center gap-1 text-green-700/80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/80 inline-block" />
              nay
            </span>
          ) : (
            <span>{formatDate(person.deathDate)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
