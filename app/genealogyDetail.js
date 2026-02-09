import React, { useEffect, useState } from "react";

// import style from "@/styles/SupplyPage.module.css";

// import ShopInfo from "@/SellerPages/SellerDetail/ShopInfo";
import { useRouter } from "next/router";
import GenealogyDetailPage from "@/pages/GenealogyDetailPage/GenealogyDetailPage";

const genealogyDetail = () => {
  // const [theme, colorMode] = useMode();
  const [clandId, setClanId] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { _clanId } = router.query;
    setClanId(_clanId);
  }, [router.isReady, router.query]);

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      <GenealogyDetailPage clanId = {clandId}/>
    </div>
  );
};

export default genealogyDetail;
