import React, { useContext, useEffect, useState } from "react";
import { formatDate } from "../Utils/helpers";
import { useSelector } from "react-redux";
import { GenealogyContext } from "@/context/GenealogyContext";
import AddSpouseModal from "./AddSpouseModal";
import AddChildModal from "./AddChildModal";

export default function DetailSidebar({
  person,
  clanItem,
  onClose,
  // onAddChild,
  // onAddSpouse,
}) {
  console.log("person: ", person);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    targetId: null,
  });

  const [modalAddChildState, setModalAddChildState] = useState(false);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  console.log("userWalletAddress: ", userWalletAddress);

  const { getOwner } = useContext(GenealogyContext);

  const [owner, setOwner] = useState("0x");

  useEffect(() => {
    if (!userWalletAddress) return;
    getOwner(clanItem?.clanId, person.id).then((result) => {
      if (result.sts) {
        setOwner(result.data);
      }
    });
  }, [userWalletAddress]);

  // const onAddChild = async (id) => {
  //   setModalState({ isOpen: true, type: "child", targetId: id });
  // };

  // const onAddSpouse = async (id) => {
  //   setModalState({ isOpen: true, type: "spouse", targetId: id });
  // };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[40%] bg-[#fdf6e3] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] 
      border-l-4 border-[#8b5a2b] transition-transform duration-500 ease-in-out z-[1000] font-serif
      ${person ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute top-6 left-[-20px] w-10 h-10 bg-[#8b5a2b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#5d3a1a] transition-colors cursor-pointer"
      >
        ✕
      </button>

      {person && (
        <div className="p-8 h-full flex flex-col">
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="flex flex-col items-center mb-8">
              <div className="w-28 h-28 rounded-full bg-[#8b5a2b]/10 border-4 border-[#8b5a2b]/30 flex items-center justify-center text-5xl mb-4 shadow-inner">
                {person.gender === "male" ? "👴" : "👵"}
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#8b5a2b] uppercase tracking-[0.3em] mb-1 font-bold">
                  {person.gender === "male"
                    ? "Thành viên Nam"
                    : "Thành viên Nữ"}
                </p>
                <h2 className="text-2xl font-bold text-[#3d2611] uppercase tracking-tight">
                  {person.name}
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                    <p className="text-[10px] text-[#8b5a2b] uppercase">
                      Năm sinh
                    </p>
                    <p className="font-bold text-[#3d2611]">
                      {formatDate(person.birthYear)}
                    </p>
                  </div>
                  <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                    <p className="text-[10px] text-[#8b5a2b] uppercase">
                      Năm mất
                    </p>
                    <p className="font-bold text-[#3d2611]">
                      {formatDate(person.deathYear)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                  Thông tin Tiểu sử
                </h3>
                <div className="relative">
                  <span className="absolute top-0 left-0 text-4xl text-[#8b5a2b]/20 font-serif">
                    “
                  </span>
                  <p className="text-[#3d2611] italic leading-relaxed pt-4 px-4 text-sm">
                    {person.bio ||
                      "Chưa có dữ liệu tiểu sử ghi chép cho thành viên này."}
                  </p>
                  <span className="absolute bottom-0 right-0 text-4xl text-[#8b5a2b]/20 font-serif">
                    ”
                  </span>
                </div>
              </section>
            </div>
          </div>

          {/* Cụm nút thao tác ở dưới cùng */}
          {owner == userWalletAddress && (
            <div className="mt-6 pt-6 border-t-2 border-[#8b5a2b]/20 flex flex-col gap-3">
              <button
                onClick={() => setModalAddChildState(true)}
                className="w-full bg-[#5d3a1a] text-[#f2e2ba] py-3 rounded font-bold text-xs hover:bg-black transition-all shadow-md uppercase tracking-wider"
              >
                + Thêm con trực hệ
              </button>

              {person.gender === "male" && (
                <button
                  onClick={() =>
                    setModalState({
                      isOpen: true,
                      type: "child",
                      targetId: person.id,
                    })
                  }
                  className="w-full bg-[#8b5a2b] text-[#f2e2ba] py-3 rounded font-bold text-xs hover:bg-[#3d2611] transition-all shadow-md uppercase tracking-wider"
                >
                  + Thêm{" "}
                  {person.gender === "male"
                    ? "Phu nhân (Vợ)"
                    : "Phu quân (Chồng)"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {modalState.isOpen && (
        <AddSpouseModal
          // isOpen={modalState.isOpen}
          onClose={() =>
            setModalState({ isOpen: false, type: null, targetId: null })
          }
          // onAdd={(newData) => {
          //   setFamilyData([
          //     ...familyData,
          //     { ...newData, id: Date.now().toString() },
          //   ]);
          //   setModalState({ isOpen: false, type: null, targetId: null });
          // }}
          person={person}
          clanItem={clanItem}
          type={modalState.type}
          // targetId={modalState.targetId}
        />
      )}

      {modalAddChildState && (
        <AddChildModal
          // isOpen={modalState.isOpen}
          onClose={() => setModalAddChildState(false)}
          // onAdd={(newData) => {
          //   setFamilyData([
          //     ...familyData,
          //     { ...newData, id: Date.now().toString() },
          //   ]);
          //   setModalState({ isOpen: false, type: null, targetId: null });
          // }}
          person={person}
          clanItem={clanItem}
          type={modalState.type}
          // targetId={modalState.targetId}
        />
      )}
    </div>
  );
}
