"use client"; // Thêm dòng này vào đầu file
import React from "react";

import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  getContract,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { lukso } from "viem/chains";

import { ERC725 } from "@erc725/erc725.js";
import profileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";

import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";

import { generateMetadataLink } from "@/components/Utils/helpers";

const privateKey = `${process.env.PRIVATE_KEY}`;

console.log("privateKey: ", privateKey);

const RPC_URL = "https://rpc.mainnet.lukso.network"; // RPC URL cho LUKSO Testnet

import { genealogyAddress, genealogyABI, familyNftABI } from "./constants";

//---CONNECTING WITH SMART CONTRACT

// Kết nối qua injected provider (window.lukso) — dùng cho giao dịch cần chữ ký user
const connectingWithSmartContract = async (smAddr, smABI) => {
  const injectedProvider =
    window.lukso || (window.ethereum?.isLukso ? window.ethereum : null);
  if (!injectedProvider) throw new Error("NO_PROVIDER");

  // Lấy danh sách accounts từ provider — bắt buộc để viem biết account nào ký
  const accounts = await injectedProvider.request({
    method: "eth_requestAccounts",
  });
  if (!accounts?.length) throw new Error("EMPTY_ACCOUNTS");

  const walletClient = createWalletClient({
    account: accounts[0],   // ← gắn account vào client, viem mới cho phép write
    chain: lukso,
    transport: custom(injectedProvider),
  });

  const publicClient = createPublicClient({
    chain: lukso,
    transport: custom(injectedProvider),
  });

  const contract = getContract({
    address: smAddr,
    abi: smABI,
    client: { public: publicClient, wallet: walletClient },
  });

  return contract;
};

// Kết nối qua private key (read/write không cần user ký) — dùng cho các hàm đọc dữ liệu
const connectingSmartContractByPrivatekey = (contractAddress, contractABI) => {
  try {
    const account = privateKeyToAccount(
      privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
    );

    const publicClient = createPublicClient({
      chain: lukso,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: lukso,
      transport: http(RPC_URL),
    });

    const contract = getContract({
      address: contractAddress,
      abi: contractABI,
      client: { public: publicClient, wallet: walletClient },
    });

    return contract;
  } catch (error) {
    console.error("Error connecting to smart contract:", error);
    throw error;
  }
};

const fetchContractData = async (contractAddress, lspSchema, dataType) => {
  try {
    const erc725 = new ERC725(lspSchema, contractAddress, RPC_URL, {
      ipfsGateway: "https://api.universalprofile.cloud/ipfs/",
    });
    const data = await erc725.fetchData(dataType);
    return data;
  } catch (error) {
    console.error("Error with ERC725:", error);
    throw error;
  }
};

export const GenealogyContext = React.createContext();

export const GenealogyProvider = ({ children }) => {
  const getClanInfo = async (clanId) => {
    try {
      const clanName = await fetchContractData(
        clanId,
        lsp4Schema,
        "LSP4TokenName",
      );

      return {
        sts: true,
        data: {
          clanName: clanName.value,
        },
      };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getClanDetail = async (clanId) => {
    try {
      const contract = connectingSmartContractByPrivatekey(
        clanId,
        familyNftABI,
      );

      const clanMetadata = await fetchContractData(
        clanId,
        lsp4Schema,
        "LSP4Metadata",
      );
      const clanName = await fetchContractData(
        clanId,
        lsp4Schema,
        "LSP4TokenName",
      );

      const clanOwner = await contract.read.tokenOwnerOf([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ]);

      const clanDesc = await contract.read.clanShortDesc();

      return {
        sts: true,
        data: {
          clanMetadata: JSON.stringify(clanMetadata, null, 2),
          clanName: clanName.value,
          clanDesc: clanDesc,
          clanOwner: clanOwner,
        },
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const getPersonData = async (clanId, personId) => {
    try {
      const contract = connectingSmartContractByPrivatekey(
        clanId,
        familyNftABI,
      );

      const personData = await contract.read.getPersonInfo([personId]);

      return {
        sts: true,
        data: personData,
      };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getPersonDetail = async (clanId, personId) => {
    try {
      const contract = connectingSmartContractByPrivatekey(
        clanId,
        familyNftABI,
      );
      const personMetadata = await contract.read.getDataForTokenId([
        personId,
        ERC725YDataKeys.LSP4["LSP4Metadata"],
      ]);

      const erc725js = new ERC725(lsp4Schema);

      // Decode the metadata
      const decodedMetadata = erc725js.decodeData([
        {
          keyName: "LSP4Metadata",
          value: personMetadata,
        },
      ]);
      const metadataURL = decodedMetadata[0].value.url;

      const metadataJsonLink = generateMetadataLink(metadataURL);
      // console.log("metadataJsonLink: ", metadataJsonLink);
      // Fetch the URL
      if (metadataJsonLink) {
        const response = await fetch(metadataJsonLink);
        const jsonMetadata = await response.json();
        // console.log("Metadata Contents: ", jsonMetadata?.LSP4Metadata);
        // return {
        //   sts: true,
        //   data: jsonMetadata?.LSP4Metadata,
        // };
        return { sts: true, data: jsonMetadata?.LSP4Metadata };
      } else {
        return { sts: true, data: null };
      }

      // return { sts: true, data: JSON.stringify(decodedMetadata, null, 2) };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getOwner = async (clanId, personId) => {
    try {
      const familyNFTContract = connectingSmartContractByPrivatekey(
        clanId,
        familyNftABI,
      );
      const ownerOfToken = await familyNFTContract.read.tokenOwnerOf([personId]);
      // console.log("tokenIdMetadata: ", tokenIdMetadata);

      return {
        sts: true,
        data: ownerOfToken,
      };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const createClan = async (walletAddress, formData, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        genealogyAddress,
        genealogyABI,
      );

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const unwatch = publicClient.watchContractEvent({
        address: genealogyAddress,
        abi: genealogyABI,
        eventName: "ClanCreated",
        onLogs: (logs) => {
          for (const log of logs) {
            const { _creatorAddress, clanId } = log.args;
            if (walletAddress.toLowerCase() === _creatorAddress.toLowerCase()) {
              unwatch();
              callBack(clanId);
            }
          }
        },
      });

      await contract.write.createClan([
        formData.clanName,
        formData.description,
        formData.ancestorName,
        formData.ancestorDesc,
        formData.birthDate,
        formData.deathDate,
      ]);
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const updateClanShortDesc = async (
    walletAddress,
    clanId,
    newShortDesc,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const unwatch = publicClient.watchContractEvent({
        address: clanId,
        abi: familyNftABI,
        eventName: "ClanShortDescChanged",
        onLogs: (logs) => {
          for (const log of logs) {
            const { sender } = log.args;
            if (walletAddress.toLowerCase() === sender.toLowerCase()) {
              unwatch();
              callBack();
            }
          }
        },
      });

      await contract.write.setClanShortDesc([newShortDesc]);
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const addChild = async (
    walletAddress,
    clanId,
    formData,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      // console.log("Dữ liệu AddChild: ", formData);

      const unwatch = publicClient.watchContractEvent({
        address: clanId,
        abi: familyNftABI,
        eventName: "ChildAdded",
        onLogs: (logs) => {
          for (const log of logs) {
            const { sender, newChildId } = log.args;
            if (walletAddress.toLowerCase() === sender.toLowerCase()) {
              unwatch();
              callBack(newChildId);
            }
          }
        },
      });

      await contract.write.addChild([
        formData.parentId,
        formData.name,
        formData.shortDesc,
        formData.gender,
        formData.birthDate,
        formData.deathDate,
      ]);
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const removeChild = async (
    walletAddress,
    clanId,
    childId,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      // Đăng ký listener TRƯỚC khi gửi transaction
      // tránh miss event do block time nhanh trên LUKSO
      const unwatch = publicClient.watchContractEvent({
        address: clanId,
        abi: familyNftABI,
        eventName: "ChildRemoved",
        onLogs: (logs) => {
          for (const log of logs) {
            const { sender } = log.args;
            // Chỉ cần kiểm tra sender — childId đã được đảm bảo đúng bởi transaction
            if (walletAddress.toLowerCase() === sender.toLowerCase()) {
              unwatch();
              callBack();
            }
          }
        },
      });

      await contract.write.removeChild([childId]);
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const removeSpouse = async (
    walletAddress,
    clanId,
    personId,
    spouseId,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      // Đăng ký listener TRƯỚC khi gửi transaction
      const unwatch = publicClient.watchContractEvent({
        address: clanId,
        abi: familyNftABI,
        eventName: "SpouseRemoved",
        onLogs: (logs) => {
          for (const log of logs) {
            const { sender } = log.args;
            // Chỉ cần kiểm tra sender — personId/spouseId đã đúng bởi transaction
            if (walletAddress.toLowerCase() === sender.toLowerCase()) {
              unwatch();
              callBack();
            }
          }
        },
      });

      await contract.write.removeSpouse([personId, spouseId]);
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const addSpouse = async (
    walletAddress,
    clanId,
    formData,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const unwatch = publicClient.watchContractEvent({
        address: clanId,
        abi: familyNftABI,
        eventName: "SpouseAdded",
        onLogs: (logs) => {
          for (const log of logs) {
            const { sender, newSpouseId } = log.args;
            if (walletAddress.toLowerCase() === sender.toLowerCase()) {
              unwatch();
              callBack(newSpouseId);
            }
          }
        },
      });

      await contract.write.addSpouse([
        formData.personId,
        formData.name,
        formData.shortDesc,
        formData.birthDate,
        formData.deathDate,
      ]);
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const updatePersonData = async (
    walletAddress,
    clanId,
    formData,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      // console.log("382: formData: ", formData);
      const unwatch = publicClient.watchContractEvent({
        address: clanId,
        abi: familyNftABI,
        eventName: "UpdatePersonData",
        onLogs: (logs) => {
          for (const log of logs) {
            const { sender } = log.args;
            if (walletAddress.toLowerCase() === sender.toLowerCase()) {
              unwatch();
              callBack();
            }
          }
        },
      });

      await contract.write.updatePersonData([
        formData.personId,
        formData.name,
        formData.shortDesc,
        formData.birthYear,
        formData.deathYear,
      ]);
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const transferOwnership = async (
    walletAddress,
    clanId,
    newOwner,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      // console.log("382: formData: ", formData);
      //OwnershipTransferred(_owner, newOwner)
      const unwatch = publicClient.watchContractEvent({
        address: clanId,
        abi: familyNftABI,
        eventName: "OwnershipTransferred",
        onLogs: (logs) => {
          for (const log of logs) {
            const { _owner } = log.args;
            if (walletAddress.toLowerCase() === _owner.toLowerCase()) {
              unwatch();
              callBack();
            }
          }
        },
      });

      await contract.write.transferOwnership([newOwner]);
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const checkDeployedCode = async (address) => {
    try {
      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });
      const code = await publicClient.getBytecode({ address });
      // console.log("code: ", code);

      return code !== undefined && code !== "0x";
    } catch (error) {
      // console.log("error: ", error);
    }
  };

  const getUserProfile = async (walletAddress) => {
    const isContract = await checkDeployedCode(walletAddress);

    // console.log("isContract: ", isContract);
    if (isContract) {
      try {
        const userData = await fetchContractData(
          walletAddress,
          profileSchema,
          "LSP3Profile",
        );
        // console.log("userData = ", userData);

        return { sts: true, data: { userData: userData } };
      } catch (error) {
        // console.log("err: ", error);

        return {
          sts: false,
          data: error,
        };
      }
    } else {
      return {
        sts: true,
        data: { key: walletAddress, name: "NotLSP3Profile", value: null },
      };
    }
  };

  const getNFTCollection = async (walletAddress) => {
    try {
      let allNFT = [];
      let isCreator = false;
      const receivedAssetsValue = await fetchContractData(
        walletAddress,
        profileSchema,
        "LSP5ReceivedAssets[]",
        // "LSP12IssuedAssets[]",
      );

      const nftContract = connectingSmartContractByPrivatekey(
        genealogyAddress,
        genealogyABI,
      );

      // console.log(": ", receivedAssetsValue);
      if (Array.isArray(receivedAssetsValue?.value)) {
        await Promise.all(
          receivedAssetsValue?.value?.map(async (el) => {
            // console.log("receivedAssetsValue: ", el);

            const ownerNFT = await nftContract.read.getClanOwner([el]);
            if (ownerNFT != 0x0000000000000000000000000000000000000000) {
              if (!allNFT.includes(el)) {
                allNFT.push(el);
              }
              if (ownerNFT == walletAddress) {
                isCreator = true;
              }
            }
          }),
        );
      }

      // console.log("allNFT: ", allNFT);
      return { sts: true, data: { allNFT: allNFT, isCreator: isCreator } };
    } catch (error) {
      // console.log("error: ", error);

      return { sts: false, data: error };
    }
  };

  return (
    <GenealogyContext.Provider
      value={{
        createClan,
        getClanInfo,
        getClanDetail,
        updateClanShortDesc,
        getPersonData,
        getPersonDetail,
        getOwner,
        addChild,
        removeChild,
        addSpouse,
        removeSpouse,
        updatePersonData,

        transferOwnership,
        getUserProfile,
        getNFTCollection,
      }}
    >
      {children}
    </GenealogyContext.Provider>
  );
};
