"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const DATA_DETAIL = {
  title: "NGUYỄN TỘC PHẢ ĐỒ",
  avatar:
    "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png",
  shortDesc:
    "Dòng dõi cụ Nguyễn Văn Tổ, khởi nguồn từ vùng đất tổ linh thiêng, gìn giữ gia phong qua nhiều thế hệ.",
  fullDesc: `Dòng họ Nguyễn tại đây có truyền thống hiếu học và lòng yêu nước nồng nàn. Khởi đầu từ thế kỷ 18, cụ tổ Nguyễn Văn Tổ đã khai khẩn vùng đất này, lập nên cơ đồ cho con cháu. 

Trải qua nhiều biến cố lịch sử, gia phả vẫn được lưu giữ cẩn thận như một báu vật linh thiêng. Mỗi năm vào ngày giỗ Tổ, con cháu từ khắp nơi lại hội tụ về từ đường để dâng hương, tưởng nhớ công đức sinh thành và thắt chặt tình cốt nhục.`,
  gallery: [
    "https://cdn3648.cdn4s7.io.vn/media/articles/plugin/news/3280/1657886556-400426901-y-ngh-a-c-a-v-n-hoa-lang-va-dong-h.jpg",
    "https://cdn3648.cdn4s7.io.vn/media/img_9300_1.webp",
    "https://cdn3648.cdn4s7.io.vn/media/img_9310_1.webp",
    "https://cdn3648.cdn4s7.io.vn/media/img_9300_1.webp",
    "https://cdn3648.cdn4s7.io.vn/media/img_9310_1.webp",
    "https://cdn3648.cdn4s7.io.vn/media/img_9300_1.webp",
    "https://cdn3648.cdn4s7.io.vn/media/img_9310_1.webp",
    "https://cdn3648.cdn4s7.io.vn/media/img_9300_1.webp",
  ],
};

export default function GenealogyDetailPage({ clanId }) {
  const router = useRouter();
  // Thay vì lưu URL, ta lưu index của ảnh trong mảng gallery
  const [currentIndex, setCurrentIndex] = useState(null);

  // Hàm chuyển ảnh tiếp theo
  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % DATA_DETAIL.gallery.length);
  };

  // Hàm quay lại ảnh trước
  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) =>
        (prev - 1 + DATA_DETAIL.gallery.length) % DATA_DETAIL.gallery.length,
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#e8d5b5] font-serif overflow-y-auto pb-20">
      {/* 1. KHUNG HÌNH ĐẦY ĐỦ (LIGHTBOX) VỚI PHÍM ĐIỀU HƯỚNG */}
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
              src={DATA_DETAIL.gallery[currentIndex]}
              className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in duration-300"
              alt="Full view"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Hiển thị số thứ tự ảnh (Ví dụ: 1/8) */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 font-sans text-sm tracking-widest">
              {currentIndex + 1} / {DATA_DETAIL.gallery.length}
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
      {/* Banner Header */}
      <div className="w-full h-[40vh] relative border-b-4 border-[#5d3a1a]">
        <img
          src={DATA_DETAIL.avatar}
          className="w-full h-full object-cover opacity-60"
          alt="banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d2611] to-transparent"></div>
        <div className="absolute bottom-4 left-10 right-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-[#f2e2ba] uppercase tracking-[0.2em] drop-shadow-lg">
            {DATA_DETAIL.title}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Cột trái: Thông tin chính */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#3d2611] border-b-2 border-[#5d3a1a] pb-2 mb-4 uppercase tracking-widest">
              Mô tả ngắn
            </h2>
            <p className="text-[#5d3a1a] text-lg italic leading-relaxed">
              "{DATA_DETAIL.shortDesc}"
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#3d2611] border-b-2 border-[#5d3a1a] pb-2 mb-4 uppercase tracking-widest">
              Lịch sử dòng tộc
            </h2>
            <div className="text-[#3d2611] text-lg leading-loose whitespace-pre-line text-justify">
              {DATA_DETAIL.fullDesc}
            </div>
          </section>

          {/* Bộ sưu tập hình ảnh */}
          <section>
            <h2 className="text-2xl font-bold text-[#3d2611] border-b-2 border-[#5d3a1a] pb-2 mb-6 uppercase tracking-widest">
              Bộ sưu tập hình ảnh
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {DATA_DETAIL.gallery.map((img, index) => (
                <div
                  key={index}
                  className="h-40 overflow-hidden border-2 border-[#5d3a1a] shadow-md group"
                  onClick={() => setCurrentIndex(index)} // Truyền index vào state
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                    alt={`gallery-${index}`}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cột phải: Sidebar chức năng */}
        <div className="space-y-6">
          <div className="bg-[#f2e2ba] border-2 border-[#5d3a1a] p-6 shadow-[8px_8px_0px_0px_rgba(93,58,26,0.1)]">
            <h3 className="text-[#3d2611] font-bold text-center border-b border-[#5d3a1a]/20 pb-4 mb-6 uppercase tracking-tighter">
              Truy cập dữ liệu
            </h3>
            <button
              onClick={() => router.push(`/genealogy/diagram/${clanId}`)}
              className="w-full py-4 bg-[#5d3a1a] text-[#f2e2ba] font-bold rounded hover:bg-[#3d2611] transition-all flex items-center justify-center gap-3 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              XEM PHẢ ĐỒ
            </button>
          </div>

          <div className="p-6 border-2 border-dashed border-[#5d3a1a]/30 text-[#5d3a1a] text-center italic text-sm">
            Hồ sơ này đã được xác thực trên mạng lưới Blockchain LUKSO.
          </div>
        </div>
      </div>
    </div>
  );
}
