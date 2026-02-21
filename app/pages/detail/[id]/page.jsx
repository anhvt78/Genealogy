"use client";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GenealogyDetailForm from "@/app/Forms/GenealogyDetailForm";
import GenealogyDiagramForm from "@/app/Forms/GenealogyDiagramForm";

import { initialFamilyData } from "@/constants/mockData.js";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import { generateMetadataLink } from "@/components/Utils/helpers";

export default function GenealogyDetail() {
  const params = useParams(); // Lấy 'id' từ thư mục [id]
  const clanId = params.id;

  const [tabIndex, setTabIndex] = useState(0);

  const [familyData, setFamilyData] = useLocalStorage(
    "family-tree-v1",
    initialFamilyData,
  );

  const { getClanDetail } = useContext(GenealogyContext);

  const [clanItem, setClanItem] = useState();
  const [loadingClanDetail, setLoadingClanDetail] = useState(true);

  // useEffect(() => {
  //   // if (!clanId) return;
  //   // setLoadingClanDetail(true);

  //   getClanDetail(clanId).then((result) => {
  //     setLoadingClanDetail(false);
  //     if (result.sts) {
  //       const object = JSON.parse(result.data?.clanMetadata);
  //       let allImageUrls = [];
  //       try {
  //         const imagesData = object?.value?.LSP4Metadata?.images;

  //         if (Array.isArray(imagesData)) {
  //           allImageUrls = imagesData
  //             .map((subArray) => {
  //               if (Array.isArray(subArray) && subArray.length > 0) {
  //                 return generateMetadataLink(subArray[0]?.url);
  //               }
  //               return null;
  //             })
  //             .filter((url) => url); // Loại bỏ các giá trị null hoặc undefined
  //         }
  //       } catch (error) {
  //         console.error("Error extracting CIDs:", error);
  //       }

  //       const item = {
  //         clanId: clanId,
  //         clanName: result.data?.clanName,
  //         shortDesc: result.data?.clanDesc,
  //         allImageUrls: allImageUrls,
  //         clanDetail: object?.value?.LSP4Metadata?.description,
  //       };

  //       setClanItem(item);
  //     } else {
  //       sweetalert2.popupAlert({
  //         title: "Đã xả ra lỗi",
  //         text: "Lỗi khi tải thông tin Gia phả.",
  //       });
  //     }
  //   });
  // }, [clanId, getClanDetail]);
  useEffect(() => {
    // Kiểm tra nếu không có clanId thì dừng sớm và tắt loading
    if (!clanId) {
      setLoadingClanDetail(false);
      return;
    }

    // Nếu muốn chắc chắn, bạn có thể bọc trong một hàm async
    const fetchData = async () => {
      // setLoadingClanDetail(true); // Có thể gọi ở đây nếu khởi tạo là false

      try {
        const result = await getClanDetail(clanId);

        if (result.sts) {
          const object = JSON.parse(result.data?.clanMetadata);
          let allImageUrls = [];

          try {
            const imagesData = object?.value?.LSP4Metadata?.images;
            if (Array.isArray(imagesData)) {
              allImageUrls = imagesData
                .map((subArray) => {
                  if (Array.isArray(subArray) && subArray.length > 0) {
                    return generateMetadataLink(subArray[0]?.url);
                  }
                  return null;
                })
                .filter((url) => url);
            }
          } catch (error) {
            console.error("Error extracting CIDs:", error);
          }

          const item = {
            clanId: clanId,
            clanName: result.data?.clanName,
            shortDesc: result.data?.clanDesc,
            allImageUrls: allImageUrls,
            clanDetail: object?.value?.LSP4Metadata?.description,
          };

          setClanItem(item);
        } else {
          sweetalert2.popupAlert({
            title: "Đã xảy ra lỗi",
            text: "Lỗi khi tải thông tin Gia phả.",
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        // Tắt loading sau khi kết thúc (dù thành công hay thất bại)
        setLoadingClanDetail(false);
      }
    };

    fetchData();
  }, [clanId]);

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      {tabIndex == 0 && (
        <>
          {!loadingClanDetail ? (
            <GenealogyDetailForm
              clanItem={clanItem}
              setTabIndex={setTabIndex}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center font-serif">
              <p className="text-[#5d3a1a] animate-pulse text-xl">
                Đang truy vấn dữ liệu dòng tộc...
              </p>
            </div>
          )}
        </>
      )}
      {tabIndex == 1 && (
        <GenealogyDiagramForm
          familyData={familyData}
          setTabIndex={setTabIndex}
        />
      )}
    </div>
  );
}
