"use client";
import React, { useState } from "react";
import "reactflow/dist/style.css";

import { useSelector } from "react-redux";
import { ConnectorModal } from "@/components/Modals/ConnectorModal";
import ConnectPage from "../pages/ConnectPage/ConnectPage";
import ContentPage from "../pages/ContentPage";

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
        <ContentPage />
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
