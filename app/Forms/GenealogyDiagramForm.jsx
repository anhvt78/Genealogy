"use client";
import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";

import PersonNode from "@/components/nodes/PersonNode";
import DetailSidebar from "@/components/ui/DetailSidebar";
import { getLayoutedElements } from "@/utils/layoutEngine";
import ClanTitleNode from "@/components/nodes/ClanTitleNode";

import { useDispatch, useSelector } from "react-redux";
import { userSignOut } from "@/redux/genealogySlide";
import { useRouter } from "next/navigation";

import QRGeneratorModal from "@/components/ui/QRGeneratorModal";
import TransferOwnershipModal from "@/components/ui/TransferOwnershipModal";
import { ConnectorModal } from "@/components/Modals/ConnectorModal";

const nodeTypes = {
  personNode: PersonNode,
  clanTitle: ClanTitleNode,
};

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

export default function GenealogyDiagramForm({
  clanItem,
  familyData,
  setTabIndex,
  fetchDataDetail,
  fetchDataDialog,
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [modalQROpen, setModalQROpen] = useState(false);
  const [modalTransferOwner, setModalTransferOwner] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFemales, setShowFemales] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isShowModalConnector, setIsShowModalConnector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rfInstance, setRfInstance] = useState(null);
  const [pendingNavId, setPendingNavId] = useState(null);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const toggleCollapse = (id) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const onNodeClick = (event, node) => {
    const person = familyData.find((p) => p.id === node.id);
    if (person) setSelectedPerson(person);
  };

  const { nodes, edges } = useMemo(() => {
    const filteredData = (
      showFemales
        ? familyData
        : familyData.filter(
            (p) => p.gender !== "female" && p.gender !== "FEMALE",
          )
    ).sort((a, b) => {
      // ✅ FIX: So sánh BigInt đúng cách, không dùng phép trừ
      const aVal = BigInt(a.createdAt ?? 0);
      const bVal = BigInt(b.createdAt ?? 0);
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });

    const visibleFamily = getVisibleData(filteredData, collapsedIds);

    const rawNodes = [
      {
        id: "clan-header-top",
        type: "clanTitle",
        data: {
          label: `${clanItem?.clanName || "DÒNG TỘC"} PHẢ ĐỒ`,
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
          hasChildren: filteredData.some((child) =>
            child.parents?.includes(p.id),
          ),
          onNodeClick: (nodeData) => setSelectedPerson(nodeData),
          spouseNumber: p.spouses?.length || 0,
          gender: p.gender || "undefined",
          onToggleCollapse: toggleCollapse,
          showFemales: showFemales,
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

    return {
      nodes: getLayoutedElements(rawNodes, rawEdges, showFemales),
      edges: rawEdges,
    };
  }, [familyData, collapsedIds, clanItem, showFemales]);

  const searchResults = searchQuery.trim().length > 1
    ? [
        ...familyData.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
        ...familyData.flatMap((p) =>
          (p.spouses || []).filter((sp) => sp.name.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      ].slice(0, 8)
    : [];

  // Sau khi nodes re-render (do expand), navigate đến node đang chờ
  useEffect(() => {
    if (!pendingNavId || !rfInstance) return;
    const node = nodes.find((n) => n.id === pendingNavId);
    if (node) {
      rfInstance.setCenter(node.position.x + 110, node.position.y + 70, { zoom: 1.2, duration: 600 });
      setPendingNavId(null);
    }
  }, [nodes, pendingNavId, rfInstance]);

  const handleSearchSelect = (result) => {
    setSelectedPerson(result);
    const nodeId = result.isSpouse ? result.spouseId : result.id;

    // Tìm tất cả tổ tiên của node đích và bỏ collapse
    const ancestorIds = [];
    const collectAncestors = (id) => {
      const person = familyData.find((p) => p.id === id);
      if (!person) return;
      (person.parents || []).forEach((parentId) => {
        ancestorIds.push(parentId);
        collectAncestors(parentId);
      });
    };
    collectAncestors(nodeId);

    if (ancestorIds.length > 0) {
      setCollapsedIds((prev) => prev.filter((id) => !ancestorIds.includes(id)));
    }

    // Đặt pending để navigate sau khi nodes re-render xong
    setPendingNavId(nodeId);
    setSearchQuery("");
    setIsSidebarOpen(false);
  };

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
    <div className="w-full h-full bg-[#e8d5b5] flex overflow-hidden relative">
      {/* SIDEBAR BÊN TRÁI */}
      <div
        className={`transition-all duration-300 bg-[#3d2611] text-[#f2e2ba] flex flex-col shadow-2xl z-50 shrink-0 ${isSidebarOpen ? "w-72" : "w-0"}`}
      >
        <div className={`flex flex-col h-full overflow-hidden ${!isSidebarOpen && "invisible"}`}>
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-[#5d3a1a]">
            <p className="text-[10px] text-[#f2e2ba]/40 uppercase tracking-[0.25em] font-black mb-0.5">Phả đồ</p>
            <h2 className="text-base font-black uppercase tracking-widest text-[#f2e2ba] truncate">
              {clanItem?.clanName || "Quản lý"}
            </h2>
          </div>

          {/* Search */}
          <div className="px-4 pt-4 pb-2 relative">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f2e2ba]/30" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thành viên..."
                className="w-full bg-[#5d3a1a]/60 text-[#f2e2ba] placeholder-[#f2e2ba]/30 pl-9 pr-3 py-2.5 text-xs outline-none border border-[#8b5a2b]/30 focus:border-[#f2e2ba]/30 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f2e2ba]/40 hover:text-[#f2e2ba]/70">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute left-4 right-4 top-full mt-0.5 bg-[#2a1a0a] border border-[#8b5a2b]/30 shadow-2xl z-50 max-h-52 overflow-y-auto">
                {searchResults.map((p, i) => (
                  <button
                    key={`${p.id}-${i}`}
                    onClick={() => handleSearchSelect(p)}
                    className="w-full text-left px-3 py-2.5 text-xs text-[#f2e2ba]/70 hover:bg-[#5d3a1a] hover:text-[#f2e2ba] transition-colors flex items-center gap-2.5 border-b border-[#8b5a2b]/10 last:border-0"
                  >
                    <span className="w-2 h-2 shrink-0" style={{ backgroundColor: p.gender === "male" ? "#c4956a" : "#e8c99a" }} />
                    <span className="truncate font-semibold">{p.name}</span>
                    {p.isSpouse && (
                      <span className="text-[#f2e2ba]/35 text-[9px] shrink-0 italic">
                        {p.gender === "male" ? "phu quân" : "phu nhân"}
                      </span>
                    )}
                    <span className="ml-auto text-[#f2e2ba]/25 text-[10px] shrink-0">Đời {p.generation}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="flex-grow overflow-y-auto px-4 pb-4 space-y-1 mt-2">
            {/* Section: Điều hướng */}
            <p className="text-[9px] text-[#f2e2ba]/25 uppercase tracking-[0.2em] font-black px-1 pt-2 pb-1">Điều hướng</p>
            <button
              onClick={() => setTabIndex(0)}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a]/60 hover:bg-[#5d3a1a] transition-colors text-sm font-semibold w-full text-left"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Thông tin dòng tộc
            </button>

            {/* Section: Hiển thị */}
            <p className="text-[9px] text-[#f2e2ba]/25 uppercase tracking-[0.2em] font-black px-1 pt-4 pb-1">Hiển thị</p>
            <div className="flex text-xs font-bold border border-[#8b5a2b]/30 overflow-hidden">
              <button
                onClick={() => setShowFemales(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 transition-colors ${showFemales ? "bg-[#8b5a2b] text-[#f2e2ba]" : "bg-[#5d3a1a]/40 text-[#f2e2ba]/40 hover:text-[#f2e2ba]/70"}`}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                Hiện nữ
              </button>
              <button
                onClick={() => setShowFemales(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 transition-colors ${!showFemales ? "bg-[#8b5a2b] text-[#f2e2ba]" : "bg-[#5d3a1a]/40 text-[#f2e2ba]/40 hover:text-[#f2e2ba]/70"}`}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                Ẩn nữ
              </button>
            </div>

            {/* Section: Công cụ */}
            <p className="text-[9px] text-[#f2e2ba]/25 uppercase tracking-[0.2em] font-black px-1 pt-4 pb-1">Công cụ</p>
            <button
              onClick={() => setModalQROpen(true)}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a]/60 hover:bg-[#5d3a1a] transition-colors text-sm font-semibold w-full text-left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              In mã QR
            </button>
            <button
              onClick={exportImage}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a]/60 hover:bg-[#5d3a1a] transition-colors text-sm font-semibold w-full text-left"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Xuất ảnh gia phả
            </button>

            {/* Section: Quản lý (owner only) */}
            {userWalletAddress && (
              <>
                <p className="text-[9px] text-[#f2e2ba]/25 uppercase tracking-[0.2em] font-black px-1 pt-4 pb-1">Quản lý</p>
                <button
                  onClick={() => setModalTransferOwner(true)}
                  className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a]/60 hover:bg-[#5d3a1a] transition-colors text-sm font-semibold w-full text-left"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Chuyển quyền sở hữu
                </button>
              </>
            )}
          </div>

          {/* Footer: Auth */}
          <div className="px-4 pb-4 pt-2 border-t border-[#5d3a1a]">
            {userWalletAddress ? (
              <button
                onClick={() => { dispatch(userSignOut()); router.push("/"); }}
                className="flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-900/60 transition-colors text-sm font-semibold text-red-300 w-full text-left"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={() => setIsShowModalConnector(true)}
                className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a]/60 hover:bg-[#5d3a1a] transition-colors text-sm font-semibold text-[#f2e2ba] w-full text-left"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
                </svg>
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NÚT ĐÓNG/MỞ SIDEBAR */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute left-4 top-4 z-[60] p-2 bg-[#5d3a1a] text-[#f2e2ba] rounded-full shadow-md hover:bg-[#8b5a2b] transition-all"
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
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onInit={setRfInstance}
          onPaneClick={() => setSelectedPerson(null)}
          nodesDraggable={!isLocked}
          nodesConnectable={!isLocked}
          panOnDrag={!isLocked}
          zoomOnScroll={!isLocked}
          zoomOnPinch={!isLocked}
          fitView
        >
          <Background color="#8b5a2b" opacity={0.1} />
          <Controls
            onInteractiveChange={(interactive) => setIsLocked(!interactive)}
            showInteractive={true}
          />
        </ReactFlow>
      </div>

      {selectedPerson && (
        <DetailSidebar
          person={selectedPerson}
          clanItem={clanItem}
          onClose={() => setSelectedPerson(null)}
          fetchDataDialog={fetchDataDialog}
        />
      )}
      {modalQROpen && (
        <QRGeneratorModal
          clanItem={clanItem}
          onClose={() => setModalQROpen(false)}
        />
      )}
      {modalTransferOwner && (
        <TransferOwnershipModal
          clanItem={clanItem}
          fetchDataDetail={fetchDataDetail}
          onClose={() => setModalTransferOwner(false)}
        />
      )}
      {!userWalletAddress && (
        <ConnectorModal
          isShow={isShowModalConnector}
          onHide={() => setIsShowModalConnector(false)}
        />
      )}
    </div>
  );
}
