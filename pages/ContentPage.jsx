"use client";
import React from "react";
import { useRouter } from "next/navigation";

const GENEALOGY_DATA = [
  {
    id: "nguyen-toc",
    title: "NGUYỄN TỘC PHẢ ĐỒ",
    description:
      "Dòng dõi cụ Nguyễn Văn Tổ, khởi nguồn từ vùng đất tổ linh thiêng.",
    image:
      "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png", // Thay bằng link ảnh thật
    route: "/family-tree/nguyen-toc",
  },
  {
    id: "le-toc",
    title: "LÊ TỘC THẾ PHẢ",
    description:
      "Ghi chép về sự phát triển của dòng họ Lê qua 12 đời con cháu.",
    image:
      "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png",
    route: "/family-tree/le-toc",
  },
  {
    id: "le-toc",
    title: "LÊ TỘC THẾ PHẢ",
    description:
      "Ghi chép về sự phát triển của dòng họ Lê qua 12 đời con cháu.",
    image:
      "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png",
    route: "/family-tree/le-toc",
  },
  {
    id: "le-toc",
    title: "LÊ TỘC THẾ PHẢ",
    description:
      "Ghi chép về sự phát triển của dòng họ Lê qua 12 đời con cháu.",
    image:
      "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png",
    route: "/family-tree/le-toc",
  },
  // Thêm các mục khác tại đây...
];

export default function ContentPage() {
  const router = useRouter();

  return (
    // <div className="min-h-screen bg-[#e8d5b5] p-8 md:p-16 font-serif flex flex-col items-center">
    <div className="min-h-screen w-full bg-[#e8d5b5] font-serif overflow-y-auto py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        {/* Tiêu đề trang phong cách cổ điển */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-[#3d2611] tracking-[0.2em] uppercase mb-4">
            Hệ Thống Gia Phả Trực Tuyến
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-20 bg-[#5d3a1a]"></div>
            <p className="text-[#5d3a1a] italic text-lg italic">
              "Cây có cội, nước có nguồn"
            </p>
            <div className="h-[2px] w-20 bg-[#5d3a1a]"></div>
          </div>
        </div>

        {/* Danh sách các mục chọn */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
          {GENEALOGY_DATA.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(item.route)}
              className="group cursor-pointer bg-[#f2e2ba] border-2 border-[#5d3a1a] shadow-[10px_10px_0px_0px_rgba(93,58,26,0.1)] hover:shadow-[15px_15px_0px_0px_rgba(93,58,26,0.2)] hover:-translate-y-2 transition-all duration-300 overflow-hidden"
            >
              {/* Hình ảnh đại diện */}
              <div className="h-48 overflow-hidden border-b-2 border-[#5d3a1a] relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-[#3d2611]/10 group-hover:bg-transparent transition-colors"></div>
              </div>

              {/* Nội dung mô tả */}
              <div className="p-6">
                <h3 className="text-[#3d2611] text-xl font-bold mb-3 uppercase tracking-wider group-hover:text-[#8b5a2b] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[#5d3a1a] text-sm leading-relaxed line-clamp-3">
                  {item.description}
                </p>

                <div className="mt-6 flex items-center text-[#3d2611] font-bold text-xs uppercase tracking-widest">
                  <span>Xem chi tiết</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}

          {/* Nút Thêm Gia Phả Mới (Dạng Placeholder) */}
          <div className="border-4 border-dashed border-[#5d3a1a]/30 flex flex-col items-center justify-center p-8 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-[#5d3a1a]/10 flex items-center justify-center mb-4 group-hover:bg-[#5d3a1a] group-hover:text-[#f2e2ba] transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="font-bold text-[#5d3a1a] uppercase tracking-tighter">
              Thêm gia tộc mới
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
