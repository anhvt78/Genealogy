import dagre from "dagre";

export const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 280,
    ranksep: 150,
    marginx: 100,
    marginy: 100,
  });

  // 1. CHỈ cho những người không phải là "vợ" vào Dagre để tính khung sườn
  nodes.forEach((node) => {
    const isWife =
      node.data.gender === "female" && node.data.partners?.length > 0;
    if (!isWife || node.type === "clanTitle") {
      // Thiết lập kích thước ảo lớn cho Tiêu đề để Dagre đẩy các tầng dưới xuống xa hơn
      const width = node.type === "clanTitle" ? 500 : 220;
      const height = node.type === "clanTitle" ? 250 : 120;
      dagreGraph.setNode(node.id, { width, height });
    }
  });

  // 2. CHỈ đưa các đường nối Cha -> Con vào Dagre
  edges.forEach((edge) => {
    if (
      !edge.id.includes("partner") &&
      dagreGraph.hasNode(edge.source) &&
      dagreGraph.hasNode(edge.target)
    ) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  // 3. Tìm Node Khởi Tổ (Ông Tổ) để lấy mốc căn giữa tiêu đề
  // Ông tổ là người không có parents và không phải là ClanTitle
  const ancestorNode = nodes.find(
    (n) =>
      (!n.data.parents || n.data.parents.length === 0) &&
      n.type !== "clanTitle",
  );
  const ancestorDagre = ancestorNode ? dagreGraph.node(ancestorNode.id) : null;

  // 4. Gán tọa độ từ Dagre cho các nút chính
  const adjustedNodes = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const isWife =
      node.data.gender === "female" && node.data.partners?.length > 0;

    if (dagreNode && !isWife) {
      // Nếu là Node tiêu đề và tìm thấy ông tổ, ép X theo ông tổ
      if (node.type === "clanTitle" && ancestorDagre) {
        return {
          ...node,
          position: {
            x: ancestorDagre.x - 480, // 250 là nửa chiều rộng ClanTitle
            y: 20, // Cố định Y trên cùng
          },
        };
      }

      // Với các node khác, lấy tọa độ từ Dagre
      return {
        ...node,
        position: { x: dagreNode.x - 110, y: dagreNode.y - 60 },
      };
    }
    return { ...node, position: { x: 0, y: 0 } };
  });

  // 5. ĐẶT NGƯỜI VỢ VÀO BÊN CẠNH CHỒNG
  adjustedNodes.forEach((node) => {
    if (node.data.gender === "female" && node.data.partners?.length > 0) {
      const husbandId = node.data.partners[0];
      const husband = adjustedNodes.find((n) => n.id === husbandId);

      if (husband) {
        node.position.y = husband.position.y;
        node.position.x = husband.position.x + 260;
      }
    }
  });

  // 6. Xử lý offset Y cuối cùng để chống chồng lấp tuyệt đối
  return adjustedNodes.map((node) => {
    if (node.type !== "clanTitle") {
      return {
        ...node,
        position: {
          ...node.position,
          y: node.position.y + 120, // Đẩy toàn bộ cây xuống 120px so với tiêu đề
        },
      };
    }
    return node;
  });
};
