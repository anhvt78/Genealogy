"use client";
import React, { useEffect, useState } from "react";

import GenealogyDetailPage from "@/pages/GenealogyDetailPage/GenealogyDetailPage";
import { useParams } from "next/navigation";
import ContentForm from "@/app/Forms/ContentForm";

export default function GenealogyDiagram() {
  const params = useParams(); // Lấy 'id' từ thư mục [id]
  const clanId = params.id;

  if (!clanId) {
    return (
      <div className="min-h-screen bg-[#e8d5b5] flex items-center justify-center font-serif">
        <p className="text-[#5d3a1a] animate-pulse">
          Đang truy vấn dữ liệu dòng tộc...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      <ContentForm clanId={clanId} />
    </div>
  );
}
