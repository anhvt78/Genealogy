import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import PersonCard from "@/components/nodes/PersonCard";

// const NodeCard = ({ person, subTitle, isMain, onNodeSelect }) => (
//   <div
//     onClick={(e) => {
//       e.stopPropagation();
//       if (onNodeSelect) onNodeSelect(person);
//     }}
//     className={`min-w-[220px] p-5 shadow-2xl transition-all border-2 rounded-sm cursor-pointer
//         ${
//           person.gender === "male"
//             ? "bg-[#f2e2ba] border-[#8b5a2b]/30 hover:border-[#5d3a1a]"
//             : "bg-[#fdf5e6] border-[#d4a373]/30 hover:border-[#8b5a2b]"
//         }
//         ${isMain ? "scale-100" : "scale-100 opacity-90"}`}
//   >
//     <div className="flex flex-col items-center font-serif text-[#3d2611]">
//       <div className="text-[9px] uppercase tracking-[0.2em] mb-1 opacity-60">
//         {subTitle}
//       </div>
//       <div className="text-lg font-bold border-b border-[#8b5a2b]/40 pb-1 w-full text-center tracking-tight uppercase">
//         {person.name || person.label}
//       </div>
//       <div className="mt-2 flex items-center justify-center h-[32px]">
//         <div className="text-[10px] italic text-[#5d3a1a]/80 text-center leading-[16px] max-w-[180px] line-clamp-2 overflow-hidden">
//           {person.bio}
//         </div>
//       </div>
//       <div className="text-[10px] mt-2 opacity-70 font-mono">
//         {person.birthYear || "????"} — {person.deathYear || "..."}
//       </div>
//     </div>
//   </div>
// );

export default function PersonNode({ data }) {
  const isMale = data.gender === "male";

  return (
    <div className="relative flex flex-row items-start">
      {/* Handle Top nằm ở giữa Node chính */}

      <div className="flex flex-row items-center">
        <div className="group relative">
          {data.id != 1 && (
            <Handle
              type="target"
              position={Position.Top}
              // Căn chỉnh Handle luôn nằm giữa 220px của Node đầu tiên
              style={{ left: "50%" }}
              // style={{
              //       left: "50%",
              //       bottom: "0px",
              //       transform: "translateX(-50%)",
              //     }}
              className="!bg-[#5d3a1a] !w-3 !h-1 !rounded-none !border-none"
            />
          )}
          <PersonCard
            // data={data}
            person={data}
            subTitle={isMale ? "Tiên Tổ" : "Nội Tộc"}
            isMain={true}
            onNodeSelect={data.onNodeClick}
          />

          {/* NÚT TOGGLE: Đặt tuyệt đối so với Node chính */}
          {data.hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleCollapse(data.id);
              }}
              // bottom-[-12px] để đè lên Handle đáy, left: 110px để đúng tâm Node chính
              // className="absolute bottom-[-12px] left-[110px] -translate-x-1/2 w-8 h-8 bg-[#5d3a1a] text-white rounded-full border-2 border-[#f2e2ba] flex items-center justify-center text-xs shadow-md z-[110] hover:scale-110 font-bold transition-transform cursor-pointer"
              className="absolute scale-80 bottom-[-16px] left-1/2 -translate-x-1/2 w-8 h-8 bg-[#5d3a1a] text-white rounded-full border-2 border-[#f2e2ba] flex items-center justify-center text-xs shadow-md z-[110] hover:scale-100 font-bold transition-transform cursor-pointer"
            >
              {data.isCollapsed ? "+" : "-"}
            </button>
          )}
          {data.hasChildren && (
            <Handle
              type="source"
              position={Position.Bottom}
              // style={{ left: "110px" }}
              style={{
                left: "50%",
                bottom: "0px",
                transform: "translateX(-50%)",
              }}
              className="!bg-[#5d3a1a] !w-3 !h-1 !rounded-none !border-none"
            />
          )}
        </div>

        {/* Danh sách vợ */}
        {data.wives && data.wives.length > 0 && (
          <div className="flex flex-row items-center animate-in fade-in slide-in-from-left-5 duration-300">
            {data.wives.map((wife, index) => (
              <div key={index} className="flex flex-row items-center">
                <div className="w-2 border-t-2 border-dashed border-[#8b5a2b]/40"></div>
                <div className="relative">
                  <PersonCard
                    data={data}
                    person={wife}
                    subTitle={isMale ? `Vợ ${index + 1}` : `Phu Quân`}
                    isMain={false}
                    onNodeSelect={data.onNodeClick}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Handle Bottom luôn cố định ở tâm Node chính (110px) */}
      {/* {data.hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ left: "110px" }}
          className="!bg-[#5d3a1a] !w-3 !h-1 !rounded-none !border-none"
        />
      )} */}
    </div>
  );
}
