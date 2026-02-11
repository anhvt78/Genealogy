"use client";
import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";

// --- IMPORT CÁC COMPONENT ---
import PersonNode from "@/components/nodes/PersonNode";
import AddMemberModal from "@/components/ui/AddMemberModal";
import DetailSidebar from "@/components/ui/DetailSidebar";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getLayoutedElements } from "@/utils/layoutEngine";
import { initialFamilyData } from "@/constants/mockData.js";
import ClanTitleNode from "@/components/nodes/ClanTitleNode";
import { GenealogyContext } from "@/context/GenealogyContext";
import { useDispatch } from "react-redux";
import { userSignOut } from "@/redux/genealogySlide";
import { useRouter } from "next/navigation";

// [GIẢI QUYẾT WARNING] Đăng ký loại node tùy chỉnh bên ngoài component
const nodeTypes = {
  personNode: PersonNode,
  clanTitle: ClanTitleNode,
};

// Tách hàm xử lý logic ra ngoài để tránh tính toán lại trong mỗi lần render
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

export default function ContentForm({ clanId }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDaughters, setShowDaughters] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false); // Quản lý trạng thái điều hướng

  const { getProductCollection } = useContext(GenealogyContext);
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

  useEffect(() => {
    getProductCollection(clanId).then((result) => {
      console.log("Clan data loaded: ", result);
    });
  }, [clanId]);

  // [TỐI ƯU] Sử dụng useCallback để ghi nhớ hàm
  const toggleCollapse = useCallback((id) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const onNodeClick = useCallback(
    (event, node) => {
      const person = familyData.find((p) => p.id === node.id);
      if (person) setSelectedPerson(person);
    },
    [familyData],
  );

  // [TỐI ƯU] Tính toán Nodes và Edges bằng useMemo
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
          onAddChild: (id) =>
            setModalState({ isOpen: true, type: "child", targetId: id }),
          onAddSpouse: (id) =>
            setModalState({ isOpen: true, type: "spouse", targetId: id }),
          onToggleCollapse: toggleCollapse,
        },
        position: { x: 0, y: 0 },
      })),
    ];

    const rawEdges = [];
    visibleFamily.forEach((p) => {
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
      if (p.partners && p.partners.length > 0) {
        p.partners.forEach((partnerId) => {
          if (p.id < partnerId) {
            rawEdges.push({
              id: `partner-${p.id}-${partnerId}`,
              source: p.id,
              target: partnerId,
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
  }, [familyData, collapsedIds, toggleCollapse]);

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
      {/* SIDEBAR TRÁI */}
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
            {/* Nút Xem Chi Tiết - [FIX] Ngăn việc bấm nhiều lần */}
            <button
              disabled={isNavigating}
              onClick={() => {
                setIsNavigating(true);
                router.push(`/genealogy/detail/${clanId}`);
              }}
              className={`flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold ${isNavigating ? "opacity-50 cursor-not-allowed" : ""}`}
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
              </svg>
              {isNavigating ? "ĐANG CHUYỂN..." : "Xem chi tiết"}
            </button>

            {/* Nút Ẩn/Hiện Con Gái với Icon thay đổi */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#5d3a1a] rounded-md text-sm font-semibold">
              <div className="flex items-center gap-3">
                {showDaughters ? (
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
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

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

      <div className="flex-grow relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedPerson(null)}
          nodesDraggable={!isLocked}
          panOnDrag={!isLocked}
          zoomOnScroll={!isLocked}
          fitView
        >
          <Background color="#8b5a2b" opacity={0.1} />
          <Controls
            onInteractiveChange={(interactive) => setIsLocked(!interactive)}
          />
        </ReactFlow>
      </div>

      {selectedPerson && (
        <DetailSidebar
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
        />
      )}

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
    </div>
  );
}
