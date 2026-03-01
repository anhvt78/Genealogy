"use client"; // Thêm dòng này vào đầu file
import React, { useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { INTERFACE_IDS } from "@lukso/lsp-smart-contracts";
import { ERC725 } from "@erc725/erc725.js";
import profileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import lsp8Schema from "@erc725/erc725.js/schemas/LSP8IdentifiableDigitalAsset.json";
// import {_LSP4_METADATA_KEY} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";

// import LSP4Artifact from "@lukso/lsp-smart-contracts/artifacts/LSP4DigitalAssetMetadata.json";
import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";

import {
  convertToEthers,
  toEnglishCharacters,
  convertEtherToWei,
  generateMetadataLink,
  toEthersUsdtAtomic,
  toEthersUsdtDisplay,
} from "@/components/Utils/helpers";

const projectId = `${process.env.INFURA_API_KEY}`;
const projectSecretKey = `${process.env.INFURA_API_KEY_SECRET}`;

const privateKey = `${process.env.PRIVATE_KEY}`;

// console.log("privateKey: ", privateKey);

const RPC_URL = "https://rpc.testnet.lukso.network"; // RPC URL cho LUKSO Testnet
const CHAIN_ID = 4201; // Chain ID của LUKSO Testnet

const auth = `Basic ${Buffer.from(`${projectId}:${projectSecretKey}`).toString(
  "base64",
)}`;

import { genealogyAddress, genealogyABI, familyNftABI } from "./constants";

const fetchContract = (smAddr, smABI, signerOrProvider) =>
  new ethers.Contract(smAddr, smABI, signerOrProvider);

//---CONNECTING WITH SMART CONTRACT

const connectingWithSmartContract = async (smAddr, smABI) => {
  const injectedProvider = window.lukso;

  const provider = new ethers.providers.Web3Provider(injectedProvider);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const contract = fetchContract(smAddr, smABI, signer);
  return contract;
};

// Hàm kết nối với smart contract
const connectingSmartContractByPrivatekey = (contractAddress, contractABI) => {
  try {
    // Tạo instance của smart contract
    const providerOfMarket = new ethers.providers.JsonRpcProvider(RPC_URL);
    const walletOfMarket = new ethers.Wallet(privateKey, providerOfMarket);
    const signerOrProviderOfMarket = walletOfMarket
      ? walletOfMarket.connect(providerOfMarket)
      : providerOfMarket;

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      signerOrProviderOfMarket,
    );
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
  //---CHECK IF WALLET IS CONNECTED
  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) {
        // return setOpenError(true), setError("Install MetaMask");
        return;
      } else {
        window.ethereum.on("accountsChanged", function (accounts) {
          currentAccount = accounts[0];
          // window.location.reload();

          if (accounts[0]) {
            // setOpenError(false);
            // getEggsOwn(accounts[0]);
            // getBidStep();
          } else {
            // setOpenError(true);
            // setError("Error while connecting to wallet");
          }
        });
      }

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts && accounts.length) {
        // setCurrentAccount(accounts[0]);
        currentAccount = accounts[0];

        // console.log(accounts.length + " : " + currentAccount);
      } else {
        // console.log("No Account Found");
        // setOpenError(true), setError("No Account Found");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const mBalance = await provider.getBalance(accounts[0]);
      const balance = ethers.utils.formatEther(mBalance);
      setAccountBalance(balance);

      // console.log("accounts: " + accounts[0]);
    } catch (error) {
      console.log("Something went wrong while connecting to wallet");
      // setOpenError(true),
      setError("Something went wrong while connecting to wallet");
    }
  };

  const getClanInfo = async (clanId) => {
    try {
      // const contract = connectingSmartContractByPrivatekey(
      //   clanId,
      //   familyNftABI,
      // );

      // const clanMetadata = await fetchContractData(
      //   clanId,
      //   lsp4Schema,
      //   "LSP4Metadata",
      // );
      const clanName = await fetchContractData(
        clanId,
        lsp4Schema,
        "LSP4TokenName",
      );

      // const clanDesc = await contract.clanShortDesc();

      return {
        sts: true,
        data: {
          // clanMetadata: JSON.stringify(clanMetadata, null, 2),
          clanName: clanName.value,
          // clanDesc: clanDesc,
        },
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
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

      const clanDesc = await contract.clanShortDesc();

      return {
        sts: true,
        data: {
          clanMetadata: JSON.stringify(clanMetadata, null, 2),
          clanName: clanName.value,
          clanDesc: clanDesc,
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

      const personData = await contract.getPersonInfo(personId);

      return {
        sts: true,
        data: personData,
      };
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
      const ownerOfToken = await familyNFTContract.tokenOwnerOf(personId);
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

      await contract.createClan(
        formData.clanName,
        formData.description,
        formData.ancestorName,
        formData.ancestorDesc,
        formData.birthDate,
        formData.deathDate,
      );

      contract.on("ClanCreated", async (_creatorAddress, clanId) => {
        console.log(
          "_creatorAddress = ",
          _creatorAddress,
          ", clanId = ",
          clanId,
        );

        if (walletAddress == _creatorAddress) {
          callBack(clanId);
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const addChild = async (
    // walletAddress,
    clanId,
    formData,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      console.log("Dữ liệu AddChild: ", formData);

      await contract.addChild(
        formData.fatherId,
        formData.name,
        formData.shortDesc,
        formData.gender,
        formData.birthDate,
        formData.deathDate,
      );

      contract.on("ChildAdded", async (fatherId, childId) => {
        if (formData.fatherId == fatherId) {
          callBack(childId);
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const removeChild = async (clanId, formData, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      await contract.removeChild(formData.fatherId, formData.childId);

      contract.on("ChildRemoved", async (fatherId, childId) => {
        if (formData.childId == childId) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const removeSpouse = async (clanId, formData, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      await contract.removeSpouse(formData.husbandId, formData.spouseId);

      contract.on("SpouseAdded", async (husbandId, spouseId) => {
        if (formData.husbandId == husbandId && formData.spouseId == spouseId) {
          callBack();
        }
      });
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

      await contract.addSpouse(
        formData.husbandId,
        formData.name,
        formData.descShort,
        formData.birthYear,
        formData.deathYear,
      );

      contract.on("SpouseAdded", async (spouseId, husbandId) => {
        if (walletAddress == husbandId && spouseId == formData.spouseId) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const updatePersonData = async (clanId, formData, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      console.log("382: formData: ", formData);
      await contract.updatePersonData(
        formData.personId,
        formData.name,
        formData.bio,
        formData.birthYear,
        formData.deathYear,
      );

      contract.on("UpdatePersonData", async (personId) => {
        if (personId == formData.personId) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const checkDeployedCode = async (address) => {
    // new ethers.providers.Web3Provider(window.ethereum);
    // const provider = new ethers.JsonRpcProvider(RPC_URL);
    try {
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const code = await provider.getCode(address);
      console.log("code: ", code);

      return code !== "0x";
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const getUserProfile = async (walletAddress) => {
    // const profileAddress = await fetchUniversalProfile(walletAddress); // trả về địa chỉ ERC725 hoặc null
    // console.log("profileAddress: ", profileAddress);

    const isContract = await checkDeployedCode(walletAddress);

    console.log("isContract: ", isContract);
    if (isContract) {
      try {
        const userData = await fetchContractData(
          walletAddress,
          profileSchema,
          "LSP3Profile",
        );
        console.log("userData = ", userData);

        return { sts: true, data: { userData: userData } };
      } catch (error) {
        console.log("err: ", error);

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

      await Promise.all(
        receivedAssetsValue.value.map(async (el) => {
          // console.log("receivedAssetsValue: ", el);

          const ownerNFT = await nftContract.getClanOwner(el);
          if (ownerNFT != 0x0000000000000000000000000000000000000000) {
            allNFT.push(el);
            if (ownerNFT == walletAddress) {
              isCreator = true;
            }
          }
        }),
      );
      // console.log("allNFT: ", allNFT);
      return { sts: true, data: { allNFT: allNFT, isCreator: isCreator } };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  return (
    <GenealogyContext.Provider
      value={{
        checkIfWalletConnected,
        createClan,
        getClanInfo,
        getClanDetail,
        getPersonData,
        getOwner,
        addChild,
        removeChild,
        addSpouse,
        removeSpouse,
        updatePersonData,
        getUserProfile,
        getNFTCollection,
      }}
    >
      {children}
    </GenealogyContext.Provider>
  );
};
