"use client"; // Thêm dòng này vào đầu file
import React from "react";
// import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import { INTERFACE_IDS } from "@lukso/lsp-smart-contracts";
import { ERC725 } from "@erc725/erc725.js";
import profileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
// import lsp8Schema from "@erc725/erc725.js/schemas/LSP8IdentifiableDigitalAsset.json";
// import {_LSP4_METADATA_KEY} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";

// import LSP4Artifact from "@lukso/lsp-smart-contracts/artifacts/LSP4DigitalAssetMetadata.json";
import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";

import {
  // convertToEthers,
  // toEnglishCharacters,
  // convertEtherToWei,
  generateMetadataLink,
  // toEthersUsdtAtomic,
  // toEthersUsdtDisplay,
} from "@/components/Utils/helpers";

// const projectId = `${process.env.INFURA_API_KEY}`;
// const projectSecretKey = `${process.env.INFURA_API_KEY_SECRET}`;

// const privateKey = `${process.env.PRIVATE_KEY}`;
const privateKey =
  "98f893278558ef777032bc95f5f612bb3138e49957926351fb7d48a67acf7860";

// console.log("privateKey: ", privateKey);

const RPC_URL = "https://rpc.mainnet.lukso.network"; // RPC URL cho LUKSO Testnet
// const CHAIN_ID = 4201; // Chain ID của LUKSO Testnet

// const auth = `Basic ${Buffer.from(`${projectId}:${projectSecretKey}`).toString(
//   "base64",
// )}`;

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
  // const checkIfWalletConnected = async () => {
  //   try {
  //     if (!window.ethereum) {
  //       // return setOpenError(true), setError("Install MetaMask");
  //       return;
  //     } else {
  //       window.ethereum.on("accountsChanged", function (accounts) {
  //         currentAccount = accounts[0];
  //         // window.location.reload();

  //         if (accounts[0]) {
  //           // setOpenError(false);
  //           // getEggsOwn(accounts[0]);
  //           // getBidStep();
  //         } else {
  //           // setOpenError(true);
  //           // setError("Error while connecting to wallet");
  //         }
  //       });
  //     }

  //     const accounts = await window.ethereum.request({
  //       method: "eth_accounts",
  //     });

  //     if (accounts && accounts.length) {
  //       // setCurrentAccount(accounts[0]);
  //       currentAccount = accounts[0];

  //       // console.log(accounts.length + " : " + currentAccount);
  //     } else {
  //       // console.log("No Account Found");
  //       // setOpenError(true), setError("No Account Found");
  //     }

  //     const provider = new ethers.providers.Web3Provider(window.ethereum);
  //     const mBalance = await provider.getBalance(accounts[0]);
  //     const balance = ethers.utils.formatEther(mBalance);
  //     setAccountBalance(balance);

  //     // console.log("accounts: " + accounts[0]);
  //   } catch (error) {
  //     console.log("Something went wrong while connecting to wallet");
  //     // setOpenError(true),
  //     setError("Something went wrong while connecting to wallet");
  //   }
  // };

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

      const clanOwner = await contract.tokenOwnerOf(
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      );

      const clanDesc = await contract.clanShortDesc();

      // console.log("clanMetadata: ", clanMetadata);

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

      const personData = await contract.getPersonInfo(personId);

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
      const personMetadata = await contract.getDataForTokenId(
        personId,
        ERC725YDataKeys.LSP4["LSP4Metadata"],
      );
      // console.log("tokenIdMetadata: ", tokenIdMetadata);

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
        // console.log(
        //   "_creatorAddress = ",
        //   _creatorAddress,
        //   ", clanId = ",
        //   clanId,
        // );

        if (walletAddress == _creatorAddress) {
          callBack(clanId);
        }
      });
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

      await contract.setClanShortDesc(newShortDesc);

      contract.on("ClanShortDescChanged", async (sender) => {
        if (walletAddress == sender) {
          callBack();
        }
      });
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

      // console.log("Dữ liệu AddChild: ", formData);

      await contract.addChild(
        formData.parentId,
        formData.name,
        formData.shortDesc,
        formData.gender,
        formData.birthDate,
        formData.deathDate,
      );

      contract.on("ChildAdded", async (sender, parentId, newChildId) => {
        if (walletAddress == sender && formData.parentId == parentId) {
          callBack(newChildId);
        }
      });
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

      await contract.removeChild(childId);

      contract.on("ChildRemoved", async (sender, childIdDeleted) => {
        if (walletAddress == sender && childId == childIdDeleted) {
          callBack();
        }
      });
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

      await contract.removeSpouse(personId, spouseId);

      contract.on("SpouseRemoved", async (sender, personId, spouseId) => {
        if (walletAddress == sender && spouseId == spouseId) {
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

      // console.log("formData = ", formData, " | clanId: ", clanId);

      await contract.addSpouse(
        formData.personId,
        formData.name,
        formData.shortDesc,
        formData.birthDate,
        formData.deathDate,
      );

      contract.on("SpouseAdded", async (sender, personId, newSpouseId) => {
        if (sender == walletAddress && personId == formData.personId) {
          callBack(newSpouseId);
        }
      });
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
      // console.log("382: formData: ", formData);
      await contract.updatePersonData(
        formData.personId,
        formData.name,
        formData.shortDesc,
        formData.birthYear,
        formData.deathYear,
      );

      contract.on("UpdatePersonData", async (sender, personId) => {
        if (walletAddress == sender && personId == formData.personId) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  // const removeClanFromOwned = async (
  //   walletAddress,
  //   clanId,
  //   callBack,
  //   handleErr,
  // ) => {
  //   try {
  //     const contract = await connectingWithSmartContract(
  //       genealogyAddress,
  //       genealogyABI,
  //     );

  //     await contract.removeClanFromOwned(clanId);

  //     contract.on("ClanRemovedFromOwned", async (sender, clanIdRemoved) => {
  //       if (walletAddress == sender && clanId == clanIdRemoved) {
  //         callBack();
  //       }
  //     });
  //   } catch (error) {
  //     handleErr("Error", error);
  //   }
  // };

  const transferOwnership = async (
    walletAddress,
    clanId,
    newOwner,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      // console.log("382: formData: ", formData);
      await contract.transferOwnership(newOwner);
      //OwnershipTransferred(_owner, newOwner)
      contract.on("OwnershipTransferred", async (_owner, _newOwner) => {
        if (walletAddress == _owner && newOwner == _newOwner) {
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
      // console.log("code: ", code);

      return code !== "0x";
    } catch (error) {
      // console.log("error: ", error);
    }
  };

  const getUserProfile = async (walletAddress) => {
    // const profileAddress = await fetchUniversalProfile(walletAddress); // trả về địa chỉ ERC725 hoặc null
    // console.log("profileAddress: ", profileAddress);

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

            const ownerNFT = await nftContract.getClanOwner(el);
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
        // checkIfWalletConnected,
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
        // removeClanFromOwned,
        transferOwnership,
        getUserProfile,
        getNFTCollection,
      }}
    >
      {children}
    </GenealogyContext.Provider>
  );
};
