import dagre from "dagre";

export const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 280, // Khoảng cách ngang đủ rộng để kẹp người vợ vào giữa
    ranksep: 150,
    marginx: 100,
    marginy: 100,
  });

  // 1. CHỈ cho những người không phải là "vợ" vào Dagre để tính khung sườn
  nodes.forEach((node) => {
    const isWife =
      node.data.gender === "female" && node.data.partners?.length > 0;
    if (!isWife) {
      dagreGraph.setNode(node.id, { width: 220, height: 120 });
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

  // 3. Gán tọa độ từ Dagre cho các nút chính
  const adjustedNodes = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    if (dagreNode) {
      return {
        ...node,
        position: { x: dagreNode.x - 110, y: dagreNode.y - 60 },
      };
    }
    return { ...node, position: { x: 0, y: 0 } }; // Tạm thời cho vợ ở 0,0
  });

  // 4. TỰ TAY ĐẶT NGƯỜI VỢ VÀO BÊN CẠNH CHỒNG
  // Cách này giúp người vợ không làm ảnh hưởng đến vị trí của các con
  adjustedNodes.forEach((node) => {
    if (node.data.gender === "female" && node.data.partners?.length > 0) {
      const husbandId = node.data.partners[0];
      const husband = adjustedNodes.find((n) => n.id === husbandId);

      if (husband) {
        node.position.y = husband.position.y;
        node.position.x = husband.position.x + 260; // Luôn cách chồng 260px bên phải
      }
    }
  });

  return adjustedNodes;
};
