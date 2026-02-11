"use client";
import React, { useEffect, useState } from "react";

import GenealogyDetailForm from "@/app/Forms/GenealogyDetailForm";
import { useParams } from "next/navigation";

export default function GenealogyDetail() {
  const params = useParams(); // Lấy 'id' từ thư mục [id]
  const clanId = params.id;

  if (!clanId) {
    return <div className="p-20 text-center">Đang tải dữ liệu dòng tộc...</div>;
  }

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      <GenealogyDetailForm clanId={clanId} />
    </div>
  );
}
