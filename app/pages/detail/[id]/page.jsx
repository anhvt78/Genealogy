"use client";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GenealogyDetailForm from "@/app/Forms/GenealogyDetailForm";
import GenealogyDiagramForm from "@/app/Forms/GenealogyDiagramForm";

import { initialFamilyData } from "@/constants/mockData.js";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import {
  generateMetadataLink,
  numberToByte32,
} from "@/components/Utils/helpers";

export default function GenealogyDetail() {
  const params = useParams(); // Lấy 'id' từ thư mục [id]
  const clanId = params.id;

  const [tabIndex, setTabIndex] = useState(0);

  let familyDatas = [];

  const [familyData, setFamilyData] = useLocalStorage(
    "family-tree-v1",
    initialFamilyData,
  );

  const { getClanDetail, getPersonData } = useContext(GenealogyContext);

  const [clanItem, setClanItem] = useState();
  const [loadingClanDetail, setLoadingClanDetail] = useState(true);
  const [loadingClanDialog, setLoadingClanDialog] = useState(true);

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
      setLoadingClanDialog(false);
      return;
    }

    // Nếu muốn chắc chắn, bạn có thể bọc trong một hàm async

    fetchDataDetail();

    const ancestorId = numberToByte32(1);

    fetchDataDialog(ancestorId);
  }, [clanId]);

  const fetchDataDetail = async () => {
    // setLoadingClanDetail(true); // Có thể gọi ở đây nếu khởi tạo là false

    try {
      const result = await getClanDetail(clanId);

      console.log("result1: ", result);

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

  const fetchDataDialog = async (personId) => {
    try {
      // const ancestorId = numberToByte32(1);

      const result = await getPersonData(clanId, personId);

      // console.log("result: ", result);

      if (result.sts) {
        let item = {
          id: personId,
          name: result.data.name,
          gender: result.data.sex,
          birthYear: result.data.birthDate,
          deathYear: result.data.deathDate,
          bio: result.data.shortDesc,
          parents: result.data.fatherId,
          // Danh sách các phu nhân được gom vào đây
          wives: [
            {
              id: "2",
              name: "Lê Thị Tổ",
              birthYear: "1905",
              deathYear: "1980",
              bio: "Mẫu nghi chính thất, thục đức vẹn toàn.",
            },
          ],
        };
        console.log("item___: ", item);
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
      setLoadingClanDialog(false);
    }
  };

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
        <>
          {!loadingClanDialog ? (
            <GenealogyDiagramForm
              familyData={familyData}
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
    </div>
  );
}
