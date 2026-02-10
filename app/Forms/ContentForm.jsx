"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";

// --- IMPORT CÁC COMPONENT ---
import PersonNode from "@/components/nodes/PersonNode";
import AddMemberModal from "@/components/ui/AddMemberModal";
import DetailSidebar from "@/components/ui/DetailSidebar"; // Bạn cần tạo file này
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getLayoutedElements } from "@/utils/layoutEngine";
import { initialFamilyData } from "@/constants/mockData.js";
import ClanTitleNode from "@/components/nodes/ClanTitleNode";
// import { ConnectorModal } from "@/components/Modals/ConnectorModal";
import { GenealogyContext } from "@/context/GenealogyContext";
import { useDispatch } from "react-redux";
import { userSignOut } from "@/redux/genealogySlide";
import { useRouter } from "next/navigation";

// Đăng ký loại node tùy chỉnh
const nodeTypes = {
  personNode: PersonNode,
  clanTitle: ClanTitleNode,
};

export default function ContentForm({ clanId }) {
  const dispatch = useDispatch();
  const router = useRouter();
  // Thêm vào trong component FamilyTreePage
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDaughters, setShowDaughters] = useState(true); // State để gạt ẩn/hiện con gái
  const { getProductCollection } = useContext(GenealogyContext);
  // const [mounted, setMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [familyData, setFamilyData] = useLocalStorage(
    "family-tree-v1",
    initialFamilyData,
  );
  const [collapsedIds, setCollapsedIds] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    targetId: null,
  });

  const [isShowModalConnector, setIsShowModalConnector] = useState(true);

  //   const userWalletAddress = useSelector(
  //     (state) => state.genealogyReducer.walletAddress,
  //   );

  useEffect(() => {
    getProductCollection(clanId).then((result) => {
      console.log("result: ", result);
    });
  }, [clanId]);

  // 1. Hàm xử lý Đóng/Mở nhánh
  const toggleCollapse = (id) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // 2. Hàm đệ quy xác định các Node bị ẩn khi thu gọn
  const getVisibleData = (allData, collapsedList) => {
    const hiddenIds = new Set();
    const addChildrenToHidden = (parentId) => {
      allData.forEach((p) => {
        if (p.parents && p.parents.includes(parentId)) {
          hiddenIds.add(p.id);
          p.partners?.forEach((partnerId) => hiddenIds.add(partnerId));
          addChildrenToHidden(p.id);
        }
      });
    };
    collapsedList.forEach((id) => addChildrenToHidden(id));
    return allData.filter((p) => !hiddenIds.has(p.id));
  };

  // 3. Xử lý khi click vào Node để hiện Sidebar
  const onNodeClick = (event, node) => {
    const person = familyData.find((p) => p.id === node.id);
    if (person) setSelectedPerson(person);
  };

  // 4. Tính toán Nodes và Edges
  const { nodes, edges } = useMemo(() => {
    const visibleFamily = getVisibleData(familyData, collapsedIds);

    const rawNodes = [
      {
        id: "clan-header-top",
        type: "clanTitle",
        data: {
          label: "NGUYỄN TỘC PHẢ ĐỒ",
          subTitle: "Uống nước nhớ nguồn - Ăn quả nhớ kẻ trồng cây",
        },
        position: { x: 0, y: 0 },
      },
      ...visibleFamily.map((p) => ({
        id: p.id,
        type: "personNode",
        data: {
          ...p,
          label: p.name,
          isCollapsed: collapsedIds.includes(p.id),
          hasChildren: familyData.some((child) =>
            child.parents?.includes(p.id),
          ),
          onNodeClick: (nodeData) => setSelectedPerson(nodeData),
          wifeNumber: p.wives?.length || 0,
          onAddChild: (id) =>
            setModalState({ isOpen: true, type: "child", targetId: id }),
          onAddSpouse: (id) =>
            setModalState({ isOpen: true, type: "spouse", targetId: id }),
          onToggleCollapse: toggleCollapse,
        },
        position: { x: 0, y: 0 },
      })),
    ];

    // Tạo Edges (Đường nối)
    const rawEdges = [];
    visibleFamily.forEach((p) => {
      // Nối Cha -> Con
      if (p.parents && p.parents.length > 0) {
        const primaryParent = p.parents[0];
        rawEdges.push({
          id: `e-${primaryParent}-${p.id}`,
          source: primaryParent,
          target: p.id,
          type: "step",
          style: { stroke: "#5d3a1a", strokeWidth: 2 },
        });
      }

      // Nối Vợ <-> Chồng
      if (p.partners && p.partners.length > 0) {
        p.partners.forEach((partnerId) => {
          if (p.id < partnerId) {
            rawEdges.push({
              id: `partner-${p.id}-${partnerId}`,
              source: p.id,
              target: partnerId,
              sourceHandle: "right",
              targetHandle: "left",
              type: "straight",
              style: {
                stroke: "#8b5a2b",
                strokeWidth: 2,
                strokeDasharray: "5,5",
              },
            });
          }
        });
      }
    });

    return { nodes: getLayoutedElements(rawNodes, rawEdges), edges: rawEdges };
  }, [familyData, collapsedIds]);

  // Hàm xuất ảnh PNG
  const exportImage = () => {
    const el = document.querySelector(".react-flow__viewport");
    if (el) {
      toPng(el, { backgroundColor: "#e8d5b5", quality: 1 }).then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "gia-pha-dong-ho.png";
        link.href = dataUrl;
        link.click();
      });
    }
  };

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      {/* SIDEBAR BÊN TRÁI */}
      <div
        className={`transition-all duration-300 bg-[#3d2611] text-[#f2e2ba] flex flex-col shadow-2xl z-50 ${isSidebarOpen ? "w-64" : "w-0"}`}
      >
        <div
          className={`p-6 flex flex-col h-full ${!isSidebarOpen && "hidden"}`}
        >
          <h2 className="text-xl font-bold mb-8 border-b border-[#5d3a1a] pb-2 text-center uppercase tracking-widest">
            Quản Lý
          </h2>

          <div className="flex flex-col gap-4 flex-grow">
            {/* Nút Xuất Ảnh */}
            <button
              onClick={() => {
                if (confirm("Tạo gia phả mới sẽ xóa dữ liệu hiện tại?"))
                  setFamilyData([]);
              }}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tạo gia phả mới
            </button>

            {/* NÚT XOÁ GIA PHẢ - MỚI THÊM */}
            <button
              onClick={() => {
                if (
                  confirm(
                    "CẢNH BÁO: Hành động này sẽ xoá sạch toàn bộ dữ liệu gia phả của bạn và không thể hoàn tác. Bạn có chắc chắn?",
                  )
                ) {
                  localStorage.removeItem("family-tree-v1"); // Xoá cứng trong LocalStorage
                  window.location.reload(); // Reload trang để reset state về mặc định
                }
              }}
              //   className="flex items-center gap-3 px-4 py-3 bg-red-700/20 hover:bg-red-700 transition-colors rounded-md text-sm font-semibold text-red-400 border border-red-700/50"
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
              </svg>
              Xoá gia phả
            </button>

            <button
              onClick={() => router.push(`/genealogy/detail/${clanId}`)}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Xem chi tiết
            </button>

            {/* Nút Gạt Ẩn/Hiện Con Gái */}
            {/* <div className="flex items-center justify-between px-4 py-3 bg-[#5d3a1a] rounded-md text-sm font-semibold">
              <span>Hiện con gái</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showDaughters}
                  onChange={() => setShowDaughters(!showDaughters)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div> */}

            {/* Nút Gạt Ẩn/Hiện Con Gái (Đã thêm Icon Con mắt) */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#5d3a1a] rounded-md text-sm font-semibold">
              <div className="flex items-center gap-3">
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg> */}
                {showDaughters ? (
                  /* Icon Con mắt mở (Khi đang HIỆN) */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-orange-400"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  /* Icon Con mắt gạch chéo (Khi đang ẨN) */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="opacity-50"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
                <span>Hiện con gái</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showDaughters}
                  onChange={() => setShowDaughters(!showDaughters)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {/* 4. Nút Xuất Ảnh (Chuyển xuống dưới nút Hiện con gái) */}
            <button
              onClick={exportImage}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Xuất ảnh gia phả
            </button>

            {/* 5. Nút Đăng Xuất (Vị trí cũ của nút Xuất ảnh) */}
            <button
              onClick={() => {
                dispatch(userSignOut());
                router.push("/");
              }}
              className="flex items-center gap-3 px-4 py-3 bg-red-900/40 hover:bg-red-800 transition-colors rounded-md text-sm font-semibold text-red-200 mt-auto mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* NÚT ĐÓNG/MỞ SIDEBAR (Nằm lơ lửng) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-4 top-4 z-[60] p-2 bg-[#5d3a1a] text-[#f2e2ba] rounded-full shadow-md hover:bg-[#8b5a2b] transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d={
              isSidebarOpen
                ? "M19 12H5M12 19l-7-7 7-7"
                : "M4 12h14M12 5l7 7-7 7"
            }
          />
        </svg>
      </button>
      {/* Vùng sơ đồ chính */}
      <div className="flex-grow relative">
        {/* <header className="absolute top-8 left-8 z-20 pointer-events-none"></header> */}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedPerson(null)}
          // --- CÁC THUỘC TÍNH KHÓA ---
          nodesDraggable={!isLocked} // Khóa kéo thả Node
          nodesConnectable={!isLocked} // Khóa tạo kết nối mới
          panOnDrag={!isLocked} // Khóa kéo bản đồ (Pan)
          zoomOnScroll={!isLocked} // Khóa zoom bằng cuộn chuột
          zoomOnPinch={!isLocked} // Khóa zoom trên bàn di chuột/màn hình cảm ứng
          fitView
        >
          <Background color="#8b5a2b" opacity={0.1} />

          {/* Tùy chỉnh Controls để nút Khóa điều khiển State của chúng ta */}
          <Controls
            onInteractiveChange={(interactive) => setIsLocked(!interactive)}
            showInteractive={true}
          />
        </ReactFlow>
      </div>

      {/* <button
        onClick={exportImage}
        className="fixed bottom-10 right-10 z-50 px-6 py-3 bg-[#5d3a1a] text-[#f2e2ba] text-sm font-bold shadow-[0_10px_25px_rgba(0,0,0,0.3)] border-2 border-[#3d2611] cursor-pointer hover:bg-[#3d2611] hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
        </svg>
        XUẤT ẢNH GIA PHẢ
      </button> */}

      {/* Sidebar chi tiết bên phải */}
      {selectedPerson && (
        <DetailSidebar
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
        />
      )}

      {/* Modal thêm thành viên */}
      {modalState.isOpen && (
        <AddMemberModal
          isOpen={modalState.isOpen}
          onClose={() =>
            setModalState({ isOpen: false, type: null, targetId: null })
          }
          onAdd={(newData) => {
            setFamilyData([
              ...familyData,
              { ...newData, id: Date.now().toString() },
            ]);
            setModalState({ isOpen: false, type: null, targetId: null });
          }}
          type={modalState.type}
          targetId={modalState.targetId}
        />
      )}
      {/* {!userWalletAddress && (
        <ConnectorModal
          isShow={isShowModalConnector}
          onHide={() => setIsShowModalConnector(false)}
        />
      )} */}
    </div>
  );
}
