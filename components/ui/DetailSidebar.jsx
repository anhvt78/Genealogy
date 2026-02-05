import React from "react";

export default function DetailSidebar({ person, onClose }) {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-[#fdf6e3] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] 
      border-l-4 border-[#8b5a2b] transition-transform duration-500 ease-in-out z-[1000] font-serif
      ${person ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute top-6 left-[-20px] w-10 h-10 bg-[#8b5a2b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#5d3a1a] transition-colors cursor-pointer"
      >
        ✕
      </button>

      {person && (
        <div className="p-8 h-full overflow-y-auto">
          <div className="flex flex-col items-center mb-8">
            <div className="w-28 h-28 rounded-full bg-[#8b5a2b]/10 border-4 border-[#8b5a2b]/30 flex items-center justify-center text-5xl mb-4 shadow-inner">
              {person.gender === "male" ? "👴" : "👵"}
            </div>
            <h2 className="text-3xl font-bold text-[#3d2611] text-center uppercase tracking-tighter">
              {person.name}
            </h2>
            <div className="h-1 w-20 bg-[#8b5a2b] mt-2 opacity-30"></div>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                Thông tin cốt lõi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                  <p className="text-[10px] text-[#8b5a2b] uppercase">
                    Năm sinh
                  </p>
                  <p className="font-bold text-[#3d2611]">
                    {person.birthYear || "Không rõ"}
                  </p>
                </div>
                <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                  <p className="text-[10px] text-[#8b5a2b] uppercase">
                    Năm mất
                  </p>
                  <p className="font-bold text-[#3d2611]">
                    {person.deathYear || "Còn sống"}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                Tiểu sử thông tin
              </h3>
              <div className="relative">
                <span className="absolute top-0 left-0 text-4xl text-[#8b5a2b]/20 font-serif">
                  “
                </span>
                <p className="text-[#3d2611] italic leading-relaxed pt-4 px-4 text-sm">
                  {person.bio ||
                    "Chưa có dữ liệu tiểu sử ghi chép cho thành viên này trong gia tộc."}
                </p>
                <span className="absolute bottom-0 right-0 text-4xl text-[#8b5a2b]/20 font-serif">
                  ”
                </span>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
