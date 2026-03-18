import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import PersonCard from "@/components/nodes/PersonCard";

export default function PersonNode({ data }) {
  // console.log("39. data = ", data);

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
        {data.showFemales && data.spouses && data.spouses.length > 0 && (
          <div className="flex flex-row items-center animate-in fade-in slide-in-from-left-5 duration-300">
            {data.spouses.map((spouse, index) => (
              <div key={index} className="flex flex-row items-center">
                <div className="w-2 border-t-2 border-dashed border-[#8b5a2b]/40"></div>
                <div className="relative">
                  <PersonCard
                    data={data}
                    person={spouse}
                    subTitle={
                      isMale ? `Vợ ${index + 1}` : `Phu Quân ${index + 1}`
                    }
                    isMain={false}
                    onNodeSelect={data.onNodeClick}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
