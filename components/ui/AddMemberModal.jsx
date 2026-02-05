import React, { useState } from "react";
import { motion } from "framer-motion";

export default function AddMemberModal({ type, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    birthYear: "",
    bio: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Xin vui lòng nhập danh tánh!");
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      {/* Lớp nền mờ cổ điển */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Nội dung Modal - Phong cách sớ/giấy cổ */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#fdf8e9] border-4 border-double border-[#5d3a1a] shadow-2xl w-full max-w-md p-8 z-10 relative"
      >
        {/* Họa tiết góc cổ điển (tùy chọn CSS) */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#5d3a1a]/20" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#5d3a1a]/20" />

        <h2 className="text-2xl font-serif font-bold text-[#3d2611] mb-2 text-center border-b border-[#8b5a2b]/30 pb-2">
          {type === "child"
            ? "THÊM TỰ TỨC (CON CÁI)"
            : "THÊM PHU PHỤ (VỢ/CHỒNG)"}
        </h2>
        <p className="text-[#8b5a2b] text-center text-xs font-serif italic mb-6">
          Điền thông tin để lưu truyền hậu thế
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 font-serif">
          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
              Họ và Tên
            </label>
            <input
              autoFocus
              className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 focus:border-[#3d2611] outline-none text-[#3d2611] transition-all"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Giới tính */}
            <div>
              <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
                Giới tính
              </label>
              <select
                className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 outline-none text-[#3d2611]"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
              >
                <option value="male">Nam (Cụ Ông)</option>
                <option value="female">Nữ (Cụ Bà)</option>
              </select>
            </div>
            {/* Năm sinh */}
            <div>
              <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
                Năm sinh
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 outline-none text-[#3d2611]"
                placeholder="19xx"
                value={formData.birthYear}
                onChange={(e) =>
                  setFormData({ ...formData, birthYear: e.target.value })
                }
              />
            </div>
          </div>

          {/* Tiểu sử ngắn */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
              Tiểu sử / Ghi chú
            </label>
            <textarea
              className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 outline-none text-[#3d2611] text-sm italic"
              placeholder="Ví dụ: Đỗ Tiến sĩ, Lương y, di cư vào Nam..."
              rows="3"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
          </div>

          {/* Nút bấm */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-[#5d3a1a] hover:bg-[#8b5a2b]/10 transition-all font-bold text-sm border border-transparent"
            >
              BÃI BỎ
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-[#3d2611] text-[#f2e2ba] font-bold text-sm shadow-lg hover:bg-[#5d3a1a] active:scale-95 transition-all border border-[#3d2611]"
            >
              LƯU VÀO TỘC PHẢ
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
