"use client";
import React, { useState } from "react";
import "reactflow/dist/style.css";

import { useSelector } from "react-redux";
import { ConnectorModal } from "@/components/Modals/ConnectorModal";
import ConnectPage from "../pages/ConnectPage/ConnectPage";
import ClanListPage from "../pages/ClanListPage";
import GenealogyDetailPage from "@/pages/GenealogyDetailPage/GenealogyDetailPage";

export default function FamilyTreePage() {
  const [isShowModalConnector, setIsShowModalConnector] = useState(true);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      {!userWalletAddress ? (
        <ConnectPage setIsShowModalConnector={setIsShowModalConnector} />
      ) : (
        <ClanListPage />
        // <GenealogyDetailPage clanId = {"0x632d00e238fb6919b2b461dd5d75e6002da64210"}/>
      )}
    </div>
  );
}
