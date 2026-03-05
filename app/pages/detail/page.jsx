"use client";
import React, { useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GenealogyDetailForm from "@/app/Forms/GenealogyDetailForm";
import GenealogyDiagramForm from "@/app/Forms/GenealogyDiagramForm";

// import { initialFamilyData } from "@/constants/mockData.js";
// import { useLocalStorage } from "@/hooks/useLocalStorage";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import {
  generateMetadataLink,
  numberToByte32,
} from "@/components/Utils/helpers";
import Lottie from "lottie-react";
import gettingDataAnimation from "../../assets/animations/gettingData.json";

const NONE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const GENDER_MAP = {
  0: "male",
  1: "female",
  2: "undefined",
};

function GenealogyDetailContent() {
  const searchParams = useSearchParams(); // Lấy 'id' từ thư mục [id]
  // const clanId = params.id;
  const clanId = searchParams.get("id");

  const [tabIndex, setTabIndex] = useState(0);

  const [familyData, setFamilyData] = useState(null);

  const { getClanDetail, getPersonData } = useContext(GenealogyContext);

  const [clanItem, setClanItem] = useState();
  const [loadingClanDetail, setLoadingClanDetail] = useState(true);
  const [loadingClanDialog, setLoadingClanDialog] = useState(true);

  useEffect(() => {
    // Kiểm tra nếu không có clanId thì dừng sớm và tắt loading
    if (!clanId) {
      setLoadingClanDetail(false);
      setLoadingClanDialog(false);
      return;
    }

    // Nếu muốn chắc chắn, bạn có thể bọc trong một hàm async

    fetchDataDetail();

    fetchDataDialog();
  }, [clanId]);

  const fetchDataDetail = async () => {
    // setLoadingClanDetail(true); // Có thể gọi ở đây nếu khởi tạo là false

    try {
      const result = await getClanDetail(clanId);

      // console.log("result1: ", result);

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
          // console.error("Error extracting CIDs:", error);
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

  const fetchDataDialog = async () => {
    setLoadingClanDialog(true);
    const ancestorId = numberToByte32(1);

    // console.log("ancestorId: ", ancestorId);
    const tempList = [];

    // console.log("159. ancestorId: ", ancestorId);

    const traverse = async (personId) => {
      // console.log("231. personId: ", personId);

      try {
        const result = await getPersonData(clanId, personId);

        // console.log("167. result: ", result);

        // Nếu API trả về thất bại ở bất kỳ mắt xích nào
        if (!result.sts) {
          throw new Error(
            `Không thể tải dữ liệu cho cá nhân có ID: ${personId}`,
          );
        }

        const data = result.data;

        // Xử lý Spouses
        const spousesDetails = await Promise.all(
          data.spouses.map(async (el) => {
            const spouseResult = await getPersonData(clanId, el);
            if (!spouseResult.sts) {
              throw new Error(
                `Lỗi khi tải thông tin vợ/chồng của ${data.name}`,
              );
            }
            return {
              id: el,
              name: spouseResult.data.name,
              birthYear: spouseResult.data.birthDate,
              deathYear: spouseResult.data.deathDate,
              shortDesc: spouseResult.data.shortDesc,
              gender: GENDER_MAP[spouseResult.data.sex] || "undefined",
              isSpouse: true,
              spouseId: personId,
            };
          }),
        );

        // console.log("198. spousesDetails: ", spousesDetails);

        const item = {
          id: personId,
          name: data.name,
          gender: GENDER_MAP[data.sex] || "undefined",
          birthYear: data.birthDate,
          deathYear: data.deathDate,
          shortDesc: data.shortDesc,
          parents: data.parentId !== NONE_ID ? [data.parentId] : [],
          spouses: spousesDetails,
        };

        tempList.push(item);

        // console.log("159. data.children: ", data.children);

        // Đệ quy lấy dữ liệu con cái
        if (data.children && data.children.length > 0) {
          await Promise.all(data.children.map((childId) => traverse(childId)));
        }
      } catch (err) {
        // Đẩy lỗi lên cấp cao hơn để dừng toàn bộ quá trình
        throw err;
      }
    };

    try {
      // Bắt đầu quá trình đệ quy
      await traverse(ancestorId);

      // Nếu thành công hết mới cập nhật State
      setFamilyData(tempList);
    } catch (error) {
      console.error("Gia phả bị gián đoạn:", error);

      // Hiển thị SweetAlert2 thông báo lỗi cụ thể
      sweetalert2.popupAlert({
        title: "Lỗi cấu trúc Gia phả",
        text:
          error.message ||
          "Có lỗi xảy ra trong quá trình truy vấn cây gia phả.",
        icon: "error",
      });

      // Reset hoặc xóa dữ liệu tạm nếu cần để tránh hiển thị sai
      // setFamilyData([]);
    } finally {
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
            <LoadingState message="Đang truy vấn dữ liệu dòng tộc..." />
          )}
        </>
      )}
      {tabIndex == 1 && (
        <>
          {!loadingClanDialog ? (
            <GenealogyDiagramForm
              clanItem={clanItem}
              familyData={familyData}
              setTabIndex={setTabIndex}
              fetchDataDialog={fetchDataDialog}
            />
          ) : (
            <LoadingState message="Đang khởi tạo sơ đồ phả hệ..." />
          )}
        </>
      )}
    </div>
  );
}

// 2. Component Loading dùng chung
function LoadingState({ message }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center font-serif bg-[#f2e2ba]">
      <div className="w-48 h-48 mb-4">
        <Lottie animationData={gettingDataAnimation} loop={true} />
      </div>
      <div className="relative">
        <p className="text-[#000000] animate-pulse text-xl font-bold tracking-widest uppercase">
          {message}
        </p>
        {/* <div className="mt-2 h-0.5 w-full bg-[#5d3a1a] origin-left animate-expand"></div> */}
      </div>
    </div>
  );
}

// 3. Export mặc định hàm mới được bọc trong Suspense
export default function GenealogyDetail() {
  return (
    <Suspense fallback={<LoadingState message="Đang khởi động..." />}>
      <GenealogyDetailContent />
    </Suspense>
  );
}
