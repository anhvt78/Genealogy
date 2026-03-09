"use client";
import React, { useContext, useMemo, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";

// --- IMPORT CÁC COMPONENT ---
import PersonNode from "@/components/nodes/PersonNode";
// import AddMemberModal from "@/components/ui/AddChildModal";
import DetailSidebar from "@/components/ui/DetailSidebar"; // Bạn cần tạo file này
// import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getLayoutedElements } from "@/utils/layoutEngine";
// import { initialFamilyData } from "@/constants/mockData.js";
import ClanTitleNode from "@/components/nodes/ClanTitleNode";
// import { ConnectorModal } from "@/components/Modals/ConnectorModal";
// import { GenealogyContext } from "@/context/GenealogyContext";
import { useDispatch, useSelector } from "react-redux";
import { userSignOut } from "@/redux/genealogySlide";
import { useRouter } from "next/navigation";

import sweetalert2 from "@/configs/swal";
import Swal from "sweetalert2";
import { GenealogyContext } from "@/context/GenealogyContext";
import QRGeneratorModal from "@/components/ui/QRGeneratorModal";
import TransferOwnershipModal from "@/components/ui/TransferOwnershipModal";
import { ConnectorModal } from "@/components/Modals/ConnectorModal";

// Đăng ký loại node tùy chỉnh
const nodeTypes = {
  personNode: PersonNode,
  clanTitle: ClanTitleNode,
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

export default function GenealogyDiagramForm({
  clanItem,
  familyData,
  setTabIndex,
  fetchDataDetail,
  fetchDataDialog,
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  // Thêm vào trong component FamilyTreePage
  const [modalQROpen, setModalQROpen] = useState(false);
  const [modalTransferOwner, setModalTransferOwner] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFemales, setShowFemales] = useState(false); // State để gạt ẩn/hiện con gái
  // const { getNFTCollection } = useContext(GenealogyContext);
  // const [mounted, setMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  // const [familyData, setFamilyData] = useLocalStorage(
  //   "family-tree-v1",
  //   initialFamilyData,
  // );
  const [collapsedIds, setCollapsedIds] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  // const [modalState, setModalState] = useState({
  //   isOpen: false,
  //   type: null,
  //   targetId: null,
  // });

  const [isShowModalConnector, setIsShowModalConnector] = useState(false); // Quản lý ẩn hiện modal đăng nhập

  const { removeClanFromOwned } = useContext(GenealogyContext);

  // const [isShowModalConnector, setIsShowModalConnector] = useState(true);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  // useEffect(() => {
  //   getNFTCollection(clanId).then((result) => {
  //     console.log("result: ", result);
  //   });
  // }, [clanId]);

  // 1. Hàm xử lý Đóng/Mở nhánh
  const toggleCollapse = (id) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // 3. Xử lý khi click vào Node để hiện Sidebar
  const onNodeClick = (event, node) => {
    const person = familyData.find((p) => p.id === node.id);
    if (person) setSelectedPerson(person);
  };

  // 4. Tính toán Nodes và Edges
  const { nodes, edges } = useMemo(() => {
    const filteredData = showFemales
      ? familyData
      : familyData.filter(
          (p) => p.gender !== "female" && p.gender !== "FEMALE",
        );

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
          // onAddChild: (id) =>
          //   setModalState({ isOpen: true, type: "child", targetId: id }),
          // onAddSpouse: (id) =>
          //   setModalState({ isOpen: true, type: "spouse", targetId: id }),
          onToggleCollapse: toggleCollapse,
          showFemales: showFemales,
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
  }, [familyData, collapsedIds, clanItem, showFemales]);

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

  const handleDelete = async () => {
    Swal.fire({
      title: "Xác nhận xóa?",
      text: `Bạn có chắc chắn muốn xóa ${
        clanItem.clanName
      } phả đồ khỏi danh sách quản lý? Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33", // Màu đỏ cho nút xóa
      cancelButtonColor: "#3085d6", // Màu xanh cho nút hủy
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Huỷ",
      reverseButtons: true, // Đưa nút Huỷ sang bên phải cho tự nhiên
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Đang xử lý...",
          text: "Vui lòng chờ trong giây lát",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading(); // Hiển thị biểu tượng quay (spinner)
          },
        });
        // try {
        // setIsProcessing(true); // Bật trạng thái đang xử lý

        // --- CHỖ NÀY: Gọi hàm xóa từ Context hoặc API của bạn ---
        // Ví dụ: const res = await deleteMember(clanItem.clanId, person.id);
        removeClanFromOwned(
          userWalletAddress,
          clanItem.clanId,
          callBack,
          handleErr,
        );

        // Giả lập xử lý thành công:
        //   setTimeout(() => {
        //     Swal.fire(
        //       "Đã xóa!",
        //       "Thành viên đã được loại bỏ khỏi gia phả.",
        //       "success",
        //     );

        //     // Gọi callback để load lại dữ liệu và đóng sidebar
        //     callBack();
        //   }, 2000);
        // } catch (error) {
        //   handleErr("Lỗi khi xóa", error.message);
        // } finally {
        //   setIsProcessing(false);
        // }
      }
    });
  };

  const callBack = () => {
    // console.log("newChildId: ", newChildId);
    // onClose();
    // setIsProcessing(false);
    Swal.fire(
      "Đã xóa!",
      "Gia phả đã không còn trong danh mục quản lý của bạn.",
      "success",
    );
    router.push("/");
    // router.push(`/pages/detail/${clanId}`);
  };

  const handleErr = (title, error) => {
    // setIsProcessing(false);
    // onClose();
    sweetalert2.popupAlert({
      title: title,
      text: error,
    });
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
            <button
              // onClick={() => router.push(`/pages/detail/${clanId}`)}
              onClick={() => {
                setTabIndex(0);
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Xem chi tiết
            </button>
            {/* NÚT XOÁ GIA PHẢ - MỚI THÊM */}
            {userWalletAddress && (
              <>
                <button
                  onClick={() => {
                    // Logic xử lý chuyển quyền (ví dụ: mở modal nhập địa chỉ ví mới)
                    setModalTransferOwner(true);
                    // Bạn có thể gọi một hàm handleTransferOwnership() tại đây
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <polyline points="17 11 19 13 23 9" />
                  </svg>
                  Chuyển quyền quản lý
                </button>
                <button
                  onClick={() => {
                    // if (
                    //   confirm(
                    //     "CẢNH BÁO: Hành động này sẽ xoá sạch toàn bộ dữ liệu gia phả của bạn và không thể hoàn tác. Bạn có chắc chắn?",
                    //   )
                    // ) {
                    //   localStorage.removeItem("family-tree-v1"); // Xoá cứng trong LocalStorage
                    //   window.location.reload(); // Reload trang để reset state về mặc định
                    // }
                    handleDelete();
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
              </>
            )}
            {/* Nút Gạt Ẩn/Hiện Con Gái */}
            {/* <div className="flex items-center justify-between px-4 py-3 bg-[#5d3a1a] rounded-md text-sm font-semibold">
              <span>Hiện con gái</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showFemales}
                  onChange={() => setShowFemales(!showFemales)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div> */}

            {/* Nút Gạt Ẩn/Hiện Con Gái (Đã thêm Icon Con mắt) */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#5d3a1a] rounded-md text-sm font-semibold">
              {showFemales ? (
                /* Icon Con mắt mở (Khi đang HIỆN) */
                <div className="flex items-center gap-3">
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
                  <span>Hiện nữ giới</span>
                </div>
              ) : (
                /* Icon Con mắt gạch chéo (Khi đang ẨN) */
                <div className="flex items-center gap-3">
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
                  <span>Ẩn nữ giới</span>
                </div>
              )}
              {/* <span>Ẩn nữ giới</span> */}

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showFemales}
                  onChange={() => setShowFemales(!showFemales)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <button
              onClick={() => setModalQROpen(true)}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              In mã QR
            </button>

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
            {/* <button
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
            </button> */}

            {/* 5. Nút Đăng nhập / Đăng xuất */}
            {userWalletAddress ? (
              // Nếu đã đăng nhập -> Hiện nút Đăng xuất
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
            ) : (
              // Nếu chưa đăng nhập -> Hiện nút Đăng nhập
              <button
                onClick={() => setIsShowModalConnector(true)}
                className="flex items-center gap-3 px-4 py-3 bg-green-900/40 hover:bg-green-800 transition-colors rounded-md text-sm font-semibold text-green-200 mt-auto mb-4"
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
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                </svg>
                Đăng nhập
              </button>
            )}
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

      {/* Sidebar chi tiết bên phải */}
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

      {/* Modal thêm thành viên */}
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
