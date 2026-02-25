import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { formatDate } from "../Utils/helpers";
import { useSelector } from "react-redux";
import { GenealogyContext } from "@/context/GenealogyContext";
import AddSpouseModal from "./AddSpouseModal";
import AddChildModal from "./AddChildModal";

export default function DetailSidebar({
  person,
  clanItem,
  onClose,
  // onAddChild,
  // onAddSpouse,
}) {
  console.log("person: ", person);

  //   // 1. Khởi tạo chiều rộng từ localStorage (nếu có) hoặc mặc định là 384px
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("sidebarWidth");
      return savedWidth ? parseInt(savedWidth, 10) : 384;
    }
    return 384;
  });

  const isResizing = useRef(false);

  // 2. Định nghĩa các hàm xử lý kéo (Dùng function để tránh lỗi thứ tự khai báo)
  function resize(e) {
    if (isResizing.current) {
      // Tính toán chiều rộng dựa trên vị trí chuột (Sidebar nằm bên phải)
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 900) {
        setWidth(newWidth);
      }
    }
  }

  function stopResizing() {
    isResizing.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);

    // THAY ĐỔI: Sử dụng classList thay vì .style
    if (typeof document !== "undefined") {
      document.body.classList.remove("is-resizing");
    }
  }

  function startResizing(e) {
    isResizing.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);

    // THAY ĐỔI: Sử dụng classList thay vì .style
    if (typeof document !== "undefined") {
      document.body.classList.add("is-resizing");
    }
  }

  // 2. Đảm bảo dọn dẹp (Cleanup) khi Sidebar bị đóng
  useEffect(() => {
    return () => {
      // Khi component unmount, đưa mọi thứ về mặc định để tránh treo cursor
      if (typeof document !== "undefined") {
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  // 3. Ghi nhớ chiều rộng vào localStorage
  useEffect(() => {
    localStorage.setItem("sidebarWidth", width);
  }, [width]);

  // Đảm bảo gỡ bỏ sự kiện khi Component bị hủy (unmount)
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    targetId: null,
  });

  const [modalAddChildState, setModalAddChildState] = useState(false);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  console.log("userWalletAddress: ", userWalletAddress);

  const { getOwner } = useContext(GenealogyContext);

  const [owner, setOwner] = useState("0x");

  useEffect(() => {
    if (!userWalletAddress) return;
    getOwner(clanItem?.clanId, person.id).then((result) => {
      if (result.sts) {
        setOwner(result.data);
      }
    });
  }, [userWalletAddress]);

  // const onAddChild = async (id) => {
  //   setModalState({ isOpen: true, type: "child", targetId: id });
  // };

  // const onAddSpouse = async (id) => {
  //   setModalState({ isOpen: true, type: "spouse", targetId: id });
  // };

  return (
    <div
      style={{ width: `${width}px` }}
      className="fixed top-0 right-0 h-full bg-[#fdf8e9] border-l-4 border-[#5d3a1a] shadow-2xl z-[50] flex flex-col transition-[width] duration-75 ease-out"
    >
      {/* THANH NẮM ĐỂ KÉO (Resizer Handle) */}
      <div
        onMouseDown={startResizing}
        className="absolute left-[-4px] top-0 w-2 h-full cursor-col-resize hover:bg-[#8b5a2b]/30 transition-colors z-[60]"
        title="Kéo để thay đổi kích thước"
      />
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* Nút đóng */}
        {/* <button
          onClick={onClose}
          className="absolute top-6 left-[-20px] w-10 h-10 bg-[#8b5a2b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#5d3a1a] transition-colors cursor-pointer"
        >
          ✕
        </button> */}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b5a2b] hover:text-[#3d2611] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {person && (
          <div className="p-8 h-full flex flex-col">
            <div className="flex-grow overflow-y-auto pr-2">
              <div className="flex flex-col items-center mb-8">
                <div className="w-28 h-28 rounded-full bg-[#8b5a2b]/10 border-4 border-[#8b5a2b]/30 flex items-center justify-center text-5xl mb-4 shadow-inner">
                  {person.gender === "male" ? "👴" : "👵"}
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#8b5a2b] uppercase tracking-[0.3em] mb-1 font-bold">
                    {person.gender === "male"
                      ? "Thành viên Nam"
                      : "Thành viên Nữ"}
                  </p>
                  <h2 className="text-2xl font-bold text-[#3d2611] uppercase tracking-tight">
                    {person.name}
                  </h2>
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                    Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                      <p className="text-[10px] text-[#8b5a2b] uppercase">
                        Năm sinh
                      </p>
                      <p className="font-bold text-[#3d2611]">
                        {formatDate(person.birthYear)}
                      </p>
                    </div>
                    <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                      <p className="text-[10px] text-[#8b5a2b] uppercase">
                        Năm mất
                      </p>
                      <p className="font-bold text-[#3d2611]">
                        {formatDate(person.deathYear)}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                    Thông tin Tiểu sử
                  </h3>
                  <div className="relative">
                    <span className="absolute top-0 left-0 text-4xl text-[#8b5a2b]/20 font-serif">
                      “
                    </span>
                    <p className="text-[#3d2611] italic leading-relaxed pt-4 px-4 text-sm">
                      {person.bio ||
                        "Chưa có dữ liệu tiểu sử ghi chép cho thành viên này."}
                    </p>
                    <span className="absolute bottom-0 right-0 text-4xl text-[#8b5a2b]/20 font-serif">
                      ”
                    </span>
                  </div>
                </section>
              </div>
            </div>

            {/* Cụm nút thao tác ở dưới cùng */}
            {owner == userWalletAddress && (
              <div className="mt-6 pt-6 border-t-2 border-[#8b5a2b]/20 flex flex-col gap-3">
                <button
                  onClick={() => setModalAddChildState(true)}
                  className="w-full bg-[#5d3a1a] text-[#f2e2ba] py-3 rounded font-bold text-xs hover:bg-black transition-all shadow-md uppercase tracking-wider"
                >
                  + Thêm con trực hệ
                </button>

                {person.gender === "male" && (
                  <button
                    onClick={() =>
                      setModalState({
                        isOpen: true,
                        type: "child",
                        targetId: person.id,
                      })
                    }
                    className="w-full bg-[#8b5a2b] text-[#f2e2ba] py-3 rounded font-bold text-xs hover:bg-[#3d2611] transition-all shadow-md uppercase tracking-wider"
                  >
                    + Thêm{" "}
                    {person.gender === "male"
                      ? "Phu nhân (Vợ)"
                      : "Phu quân (Chồng)"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {modalState.isOpen && (
          <AddSpouseModal
            // isOpen={modalState.isOpen}
            onClose={() =>
              setModalState({ isOpen: false, type: null, targetId: null })
            }
            // onAdd={(newData) => {
            //   setFamilyData([
            //     ...familyData,
            //     { ...newData, id: Date.now().toString() },
            //   ]);
            //   setModalState({ isOpen: false, type: null, targetId: null });
            // }}
            person={person}
            clanItem={clanItem}
            type={modalState.type}
            // targetId={modalState.targetId}
          />
        )}

        {modalAddChildState && (
          <AddChildModal
            // isOpen={modalState.isOpen}
            onClose={() => setModalAddChildState(false)}
            // onAdd={(newData) => {
            //   setFamilyData([
            //     ...familyData,
            //     { ...newData, id: Date.now().toString() },
            //   ]);
            //   setModalState({ isOpen: false, type: null, targetId: null });
            // }}
            person={person}
            clanItem={clanItem}
            type={modalState.type}
            // targetId={modalState.targetId}
          />
        )}
      </div>
    </div>
  );
}

//

// import React, {
//   useContext,
//   useEffect,
//   useState,
//   useRef,
//   useCallback,
// } from "react";
// import { formatDate } from "../Utils/helpers";
// import { useSelector } from "react-redux";
// import { GenealogyContext } from "@/context/GenealogyContext";
// import AddSpouseModal from "./AddSpouseModal";
// import AddChildModal from "./AddChildModal";

// export default function DetailSidebar({ person, clanItem, onClose }) {
//   // 1. Khởi tạo chiều rộng từ localStorage (nếu có) hoặc mặc định là 384px
//   const [width, setWidth] = useState(() => {
//     if (typeof window !== "undefined") {
//       const savedWidth = localStorage.getItem("sidebarWidth");
//       return savedWidth ? parseInt(savedWidth, 10) : 384;
//     }
//     return 384;
//   });

//   const isResizing = useRef(false);

//   // 2. Định nghĩa các hàm xử lý kéo (Dùng function để tránh lỗi thứ tự khai báo)
//   function resize(e) {
//     if (isResizing.current) {
//       // Tính toán chiều rộng dựa trên vị trí chuột (Sidebar nằm bên phải)
//       const newWidth = window.innerWidth - e.clientX;
//       if (newWidth > 300 && newWidth < 900) {
//         setWidth(newWidth);
//       }
//     }
//   }

//   function stopResizing() {
//     isResizing.current = false;
//     document.removeEventListener("mousemove", resize);
//     document.removeEventListener("mouseup", stopResizing);

//     // THAY ĐỔI: Sử dụng classList thay vì .style
//     if (typeof document !== "undefined") {
//       document.body.classList.remove("is-resizing");
//     }
//   }

//   function startResizing(e) {
//     isResizing.current = true;
//     document.addEventListener("mousemove", resize);
//     document.addEventListener("mouseup", stopResizing);

//     // THAY ĐỔI: Sử dụng classList thay vì .style
//     if (typeof document !== "undefined") {
//       document.body.classList.add("is-resizing");
//     }
//   }

//   // 2. Đảm bảo dọn dẹp (Cleanup) khi Sidebar bị đóng
//   useEffect(() => {
//     return () => {
//       // Khi component unmount, đưa mọi thứ về mặc định để tránh treo cursor
//       if (typeof document !== "undefined") {
//         document.body.style.cursor = "default";
//         document.body.style.userSelect = "auto";
//       }
//       document.removeEventListener("mousemove", resize);
//       document.removeEventListener("mouseup", stopResizing);
//     };
//   }, []);

//   // 3. Ghi nhớ chiều rộng vào localStorage
//   useEffect(() => {
//     localStorage.setItem("sidebarWidth", width);
//   }, [width]);

//   // Đảm bảo gỡ bỏ sự kiện khi Component bị hủy (unmount)
//   useEffect(() => {
//     return () => {
//       document.removeEventListener("mousemove", resize);
//       document.removeEventListener("mouseup", stopResizing);
//     };
//   }, []);

//   // --- Các logic hiện tại của bạn ---
//   const [modalState, setModalState] = useState({
//     isOpen: false,
//     type: null,
//     targetId: null,
//   });
//   const [modalAddChildState, setModalAddChildState] = useState(false);
//   const userWalletAddress = useSelector(
//     (state) => state.genealogyReducer.walletAddress,
//   );
//   const { getOwner } = useContext(GenealogyContext);
//   const [owner, setOwner] = useState("0x");

//   useEffect(() => {
//     if (!userWalletAddress || !person?.id) return;
//     getOwner(clanItem?.clanId, person.id).then((result) => {
//       if (result.sts) setOwner(result.data);
//     });
//   }, [userWalletAddress, person?.id]);

//   const onAddChild = () => setModalAddChildState(true);
//   const onAddSpouse = (id) =>
//     setModalState({ isOpen: true, type: "spouse", targetId: id });

//   return (
//     <div
//       style={{ width: `${width}px` }}
//       className="fixed top-0 right-0 h-full bg-[#fdf8e9] border-l-4 border-[#5d3a1a] shadow-2xl z-[50] flex flex-col transition-[width] duration-75 ease-out"
//     >
//       {/* THANH NẮM ĐỂ KÉO (Resizer Handle) */}
//       <div
//         onMouseDown={startResizing}
//         className="absolute left-[-4px] top-0 w-2 h-full cursor-col-resize hover:bg-[#8b5a2b]/30 transition-colors z-[60]"
//         title="Kéo để thay đổi kích thước"
//       />

//       {/* Nội dung Sidebar */}
//       <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-[#8b5a2b] hover:text-[#3d2611] transition-colors"
//         >
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="24"
//             height="24"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           >
//             <line x1="18" y1="6" x2="6" y2="18"></line>
//             <line x1="6" y1="6" x2="18" y2="18"></line>
//           </svg>
//         </button>

//         {person && (
//           <div className="mt-8 font-serif">
//             <h3 className="text-xl font-bold text-[#3d2611] uppercase border-b border-[#8b5a2b]/20 pb-2 mb-4">
//               Chi tiết nhân vật
//             </h3>

//             <div className="space-y-4">
//               <div>
//                 <p className="text-[10px] text-[#8b5a2b] font-bold uppercase tracking-widest">
//                   Danh tánh
//                 </p>
//                 <p className="text-lg font-bold text-[#5d3a1a]">
//                   {person.name}
//                 </p>
//               </div>

//               {/* ... Hiển thị các thông tin khác (Ngày sinh, Ngày mất, Bio...) ... */}

//               {userWalletAddress?.toLowerCase() === owner?.toLowerCase() && (
//                 <div className="pt-6 flex flex-col gap-3">
//                   <button
//                     onClick={onAddChild}
//                     className="w-full bg-[#5d3a1a] text-[#f2e2ba] py-3 rounded font-bold text-xs hover:bg-black transition-all shadow-md uppercase tracking-wider"
//                   >
//                     + Thêm con trực hệ
//                   </button>

//                   {person.gender === "male" && (
//                     <button
//                       onClick={() => onAddSpouse(person.id)}
//                       className="w-full bg-[#8b5a2b] text-[#f2e2ba] py-3 rounded font-bold text-xs hover:bg-[#3d2611] transition-all shadow-md uppercase tracking-wider"
//                     >
//                       + Thêm{" "}
//                       {person.gender === "male"
//                         ? "Phu nhân (Vợ)"
//                         : "Phu quân (Chồng)"}
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modals */}
//       {modalState.isOpen && (
//         <AddSpouseModal
//           onClose={() =>
//             setModalState({ isOpen: false, type: null, targetId: null })
//           }
//           person={person}
//           clanItem={clanItem}
//           type={modalState.type}
//           onSave={(data) => {
//             console.log("Save spouse:", data);
//             setModalState({ isOpen: false, type: null, targetId: null });
//           }}
//         />
//       )}

//       {modalAddChildState && (
//         <AddChildModal
//           onClose={() => setModalAddChildState(false)}
//           person={person}
//           clanItem={clanItem}
//           onSave={(data) => {
//             console.log("Save child:", data);
//             setModalAddChildState(false);
//           }}
//         />
//       )}
//     </div>
//   );
// }
