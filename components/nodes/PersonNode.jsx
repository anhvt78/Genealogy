import React from "react";
import { Handle, Position } from "reactflow";

export default function PersonNode({ data }) {
  const isMale = data.gender === "male";

  return (
    <div
      className={`group relative min-w-[220px] p-5 shadow-2xl transition-all border-2
      /* Hiệu ứng Giấy da */
      bg-[#f2e2ba] border-[#8b5a2b]/30 rounded-sm
      hover:border-[#5d3a1a] hover:-translate-y-1`}
    >
      {/* Nút thao tác nhanh - Thêm lớp 'pb-4' hoặc 'pt-12' để tạo vùng đệm */}
      <div className="absolute -top-12 left-0 right-0 hidden group-hover:flex justify-center gap-2 z-[9999] pb-4">
        {/* Giải thích: 
      - Căn left-0 right-0 và justify-center để vùng hover rộng bằng cả Node.
      - pb-4 (padding bottom) đóng vai trò là "cây cầu" vô hình kết nối Node và nút.
  */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddSpouse(data.id);
          }}
          className="bg-[#5d3a1a] text-[#f2e2ba] text-[10px] px-3 py-1.5 font-serif border border-[#3d2611] shadow-xl whitespace-nowrap cursor-pointer hover:bg-black transition-all"
          style={{ pointerEvents: "all" }}
        >
          + THÊM VỢ
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddChild(data.id);
          }}
          className="bg-[#8b5a2b] text-[#f2e2ba] text-[10px] px-3 py-1.5 font-serif border border-[#5d3a1a] shadow-xl whitespace-nowrap cursor-pointer hover:bg-black transition-all"
          style={{ pointerEvents: "all" }}
        >
          + THÊM CON
        </button>
      </div>

      {/* 1. Điểm kết nối TRÊN (Nhận từ Cha/Mẹ) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#5d3a1a] !w-3 !h-1 !rounded-none !border-none"
      />

      <div className="flex flex-col items-center font-serif text-[#3d2611]">
        <div className="text-[9px] uppercase tracking-[0.2em] mb-1 opacity-60">
          {isMale ? "Tiên Tổ (Nam)" : "Mẫu Nghi (Nữ)"}
        </div>

        <div className="text-lg font-bold border-b border-[#8b5a2b]/40 pb-1 w-full text-center tracking-tight">
          {data.label}
        </div>

        {/* Tiểu sử (Bio) có thêm dấu ngoặc kép */}
        {/* {data.bio && (
          <div className="mt-2 text-[10px] italic text-[#5d3a1a]/80 text-center leading-relaxed max-w-[180px] line-clamp-3">
            {data.bio}
          </div>
        )} */}

        {data.bio && (
          <div className="mt-2 flex items-center justify-center h-[32px]">
            {" "}
            {/* Cố định chiều cao cho 2 dòng */}
            <div
              className="text-[10px] italic text-[#5d3a1a]/80 text-center leading-[16px] max-w-[180px]"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {data.bio}
            </div>
          </div>
        )}

        <div className="text-[10px] mt-2 opacity-70 font-mono">
          {data.birthYear || "????"} — {data.deathYear || "..."}
        </div>
      </div>

      {/* 2. Điểm kết nối DƯỚI (Dẫn xuống Con) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#5d3a1a] !w-3 !h-1 !rounded-none !border-none"
      />

      {/* Nút Thu gọn/Mở rộng nhánh */}
      {data.gender === "male" && data.hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse(data.id);
          }}
          title={data.isCollapsed ? "Mở rộng nhánh" : "Thu gọn nhánh"}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#5d3a1a] text-white rounded-full border-2 border-[#f2e2ba] flex items-center justify-center text-xs shadow-md cursor-pointer z-[110] hover:scale-110 transition-transform font-bold"
        >
          {data.isCollapsed ? "+" : "-"}
        </button>
      )}

      {/* 3. Điểm kết nối TRÁI & PHẢI (Cho Vợ/Chồng) */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        // className="!opacity-0 !pointer-events-none"
        style={{ top: "50%", background: "transparent", border: "none" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        // className="!opacity-0 !pointer-events-none"
        style={{ top: "50%", background: "transparent", border: "none" }}
      />
    </div>
  );
}
