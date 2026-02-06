"use client";
import React, { useMemo, useState } from "react";
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

// Đăng ký loại node tùy chỉnh
const nodeTypes = {
  personNode: PersonNode,
  clanTitle: ClanTitleNode,
};

export default function FamilyTreePage() {
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

      <button
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
      </button>

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
    </div>
  );
}
