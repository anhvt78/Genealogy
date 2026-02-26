import React, { useState } from "react";
import { motion } from "framer-motion";
import { formatDate } from "../Utils/helpers";

export default function UpdateMemberModal({
  person,
  clanItem,
  onClose,
  onSave,
}) {
  const [isStillAlive, setIsStillAlive] = useState(
    person?.deathYear?.year === 0,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: person?.name || "",
    // gender: "male",
    birthYear: person?.birthYear,
    deathYear: person?.deathYear,
    bio: person?.bio,
  });

  // Hàm bóc tách ngày tháng năm từ chuỗi nhập vào giống ClanListForm
  const parseDateInput = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return { year: 0, month: 0, day: 0 };
    const parts = dateStr.split(/[\/\-.]/);
    if (parts.length === 3) {
      return {
        day: parseInt(parts[0]) || 0,
        month: parseInt(parts[1]) || 0,
        year: parseInt(parts[2]) || 0,
      };
    }
    // Nếu chỉ nhập 1 phần thì mặc định là năm
    return { day: 0, month: 0, year: parseInt(dateStr) || 0 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Xin vui lòng nhập danh tánh!");

    setIsProcessing(true); // Bắt đầu trạng thái chờ giống ClanListForm

    const formattedData = {
      ...formData,
      birthYear: parseDateInput(formData.birthYear),
      deathYear: isStillAlive
        ? { year: 0, month: 0, day: 0 }
        : parseDateInput(formData.deathYear),
    };

    try {
      // Gọi hàm onSave được truyền từ props
      await onSave(formattedData);
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
    } finally {
      setIsProcessing(false); // Kết thúc trạng thái chờ
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      {/* Lớp nền mờ */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={!isProcessing ? onClose : null}
      />

      {/* Nội dung Modal - Phong cách sớ/giấy cổ */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#fdf8e9] border-4 border-double border-[#5d3a1a] shadow-2xl w-full max-w-md p-8 z-10 relative"
      >
        <h2 className="text-2xl font-serif font-bold text-[#3d2611] mb-2 text-center border-b border-[#8b5a2b]/30 pb-2 uppercase">
          Cập nhật thông tin
        </h2>
        <p className="text-[#8b5a2b] text-center text-xs font-serif italic mb-6">
          Chỉnh sửa thông tin thành viên trong dòng tộc
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 font-serif">
          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
              Họ và Tên
            </label>
            <input
              autoFocus
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 focus:border-[#3d2611] outline-none text-[#3d2611] transition-all disabled:opacity-50"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ngày sinh */}
            <div>
              <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
                Ngày sinh
              </label>
              <input
                type="text"
                disabled={isProcessing}
                className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 outline-none text-[#3d2611] disabled:opacity-50"
                placeholder="VD: 1990 hoặc 01/01/1990"
                value={formatDate(formData.birthYear)}
                onChange={(e) =>
                  setFormData({ ...formData, birthYear: e.target.value })
                }
              />
            </div>

            {/* Ngày mất (Tương tự ClanListForm) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest">
                  Ngày mất
                </label>
                <label className="flex items-center gap-1 text-[10px] font-bold text-[#8b5a2b] cursor-pointer uppercase">
                  <input
                    type="checkbox"
                    disabled={isProcessing}
                    checked={isStillAlive}
                    onChange={(e) => setIsStillAlive(e.target.checked)}
                    className="accent-[#5d3a1a]"
                  />
                  Còn sống
                </label>
              </div>
              <input
                type="text"
                disabled={isStillAlive || isProcessing}
                className={`w-full px-4 py-2 border border-[#8b5a2b]/40 outline-none text-[#3d2611] transition-all ${
                  isStillAlive ? "bg-stone-200 opacity-50" : "bg-[#f4ece1]"
                }`}
                placeholder={isStillAlive ? "---" : "VD: 2020 hoặc 15/05/2020"}
                value={isStillAlive ? "" : formatDate(formData.deathYear)}
                onChange={(e) =>
                  setFormData({ ...formData, deathYear: e.target.value })
                }
              />
            </div>
          </div>

          {/* Tiểu sử ngắn */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
              Tiểu sử sơ lược
            </label>
            <textarea
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 outline-none text-[#3d2611] text-sm italic disabled:opacity-50"
              placeholder="Ghi chú về học vấn, sự nghiệp..."
              rows="2"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
          </div>

          {/* Cụm nút bấm có trạng thái Loading */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2 text-[#5d3a1a] hover:bg-[#8b5a2b]/10 transition-all font-bold text-sm border border-transparent disabled:opacity-50"
            >
              BÃI BỎ
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3 bg-[#3d2611] text-[#f2e2ba] font-bold text-sm shadow-lg hover:bg-[#5d3a1a] active:scale-95 transition-all border border-[#3d2611] flex items-center justify-center gap-3 uppercase tracking-wider disabled:opacity-80"
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#f2e2ba]"></div>
              )}
              <span>{isProcessing ? "Đang ghi sổ..." : "LƯU VÀO TỘC PHẢ"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
