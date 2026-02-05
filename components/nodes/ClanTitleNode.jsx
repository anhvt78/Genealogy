import React from "react";
import { Handle, Position } from "reactflow";

export default function ClanTitleNode({ data }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-w-[400px]">
      {/* Họa tiết trang trí phía trên */}
      <div className="flex items-center gap-3 mb-2 opacity-50">
        <div className="h-[1px] w-12 bg-[#8b5a2b]"></div>
        <span className="text-[#8b5a2b] text-xl">✥</span>
        <div className="h-[1px] w-12 bg-[#8b5a2b]"></div>
      </div>

      {/* Tên dòng họ chính */}
      <div className="relative group">
        <h2 className="text-6xl font-serif font-black text-[#3d2611] uppercase tracking-[0.3em] text-center drop-shadow-sm">
          {data.label || "TÊN DÒNG HỌ"}
        </h2>

        {/* Đường gạch chân kép kiểu cổ điển */}
        <div className="mt-4 flex flex-col items-center">
          <div className="h-[3px] w-full bg-[#8b5a2b] rounded-full"></div>
          {/* <div className="h-[1px] w-[80%] bg-[#8b5a2b] mt-1 opacity-60"></div> */}
        </div>
      </div>

      {/* Câu khẩu hiệu hoặc ghi chú chi ngành */}
      {data.subTitle && (
        <div className="mt-2 text-[#5d3a1a] font-serif italic text-lg opacity-80 tracking-wide">
          {data.subTitle}
        </div>
      )}

      {/* Điểm kết nối ẩn để Dagre tính toán vị trí */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !pointer-events-none"
      />
    </div>
  );
}
