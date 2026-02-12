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

// const privateKey = `${process.env.PRIVATE_KEY}`;

// console.log("privateKey: ", privateKey);

// "98f893278558ef777032bc95f5f612bb3138e49957926351fb7d48a67acf7860"; // `${process.env.PRIVATE_KEY}`;
const RPC_URL = "https://rpc.testnet.lukso.network"; // RPC URL cho LUKSO Testnet
const CHAIN_ID = 4201; // Chain ID của LUKSO Testnet

const auth = `Basic ${Buffer.from(`${projectId}:${projectSecretKey}`).toString(
  "base64",
)}`;

const providerOfMarket = new ethers.providers.JsonRpcProvider(RPC_URL);
const walletOfMarket = new ethers.Wallet(
  "9eb7d6c8b3c04c7ca0eafe20dce86fe055f1dea5f71b651dc63ef2fc404d10ac",
  providerOfMarket,
);
const signerOrProviderOfMarket = walletOfMarket
  ? walletOfMarket.connect(providerOfMarket)
  : providerOfMarket;

// const subdomain = "https://cwgame.infura-ipfs.io";

// const client = ipfsHttpClient({
//   host: "infura-ipfs.io",
//   port: 5001,
//   protocol: "https",
//   headers: {
//     authorization: auth,
//   },
// });

import {
  genealogyAddress,
  genealogyABI,
  familyNftABI,
  supplyAddress,
  supplyABI,
  marketAddress,
  marketABI,
  productAddress,
  productABI,
  saleAddress,
  saleABI,
} from "./constants";

const fetchContract = (smAddr, smABI, signerOrProvider) =>
  new ethers.Contract(smAddr, smABI, signerOrProvider);

//---CONNECTING WITH SMART CONTRACT

const connectingWithSmartContract = async (smAddr, smABI) => {
  try {
    // console.log("connection: " + JSON.stringify(connection));

    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();

    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = fetchContract(smAddr, smABI, signer);

    // console.log("signer: ", signer);
    // console.log("connection: ", connection);

    return contract;
  } catch (error) {
    console.log(
      "Something went wrong while connecting with contract: " + error,
    );
  }
};

// Hàm kết nối với smart contract
const connectingSmartContractByPrivatekey = (contractAddress, contractABI) => {
  try {
    // Tạo instance của smart contract
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
  const [feeInfo, setFeeInfo] = useState(null);

  const updateFeeInfo = async () => {
    getFeeInfo().then((result) => {
      if (result.sts) {
        setFeeInfo(result.data);
        // console.log("updateFeeInfo = ", result.data);
      }
    });
  };

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

      return {
        sts: true,
        data: {
          clanMetadata: JSON.stringify(clanMetadata, null, 2),
          clanName: clanName.value,
        },
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const getMemberData = async (tokenId) => {
    // const tokenMetadata = await fetchContractData(
    //   tokenId,
    //   lsp4Schema,
    //   "ClanShortDescription",
    // );
    // console.log("Mô tả của dòng họ này:", tokenMetadata.value);
    // return tokenMetadata.value;

    const familyNFTContract = connectingSmartContractByPrivatekey(
      tokenId,
      familyNftABI,
    );
    const tokenIdMetadata = await familyNFTContract.getDataForTokenId(
      itemId,
      ERC725YDataKeys.LSP4["ClanShortDescription"],
    );
    // console.log("tokenIdMetadata: ", tokenIdMetadata);

    const erc725js = new ERC725(lsp4Schema);

    // Decode the metadata
    const decodedMetadata = erc725js.decodeData([
      {
        keyName: "ClanShortDescription",
        value: tokenIdMetadata,
      },
    ]);
    return decodedMetadata.value;
  };

  const createClan = async (walletAddress, formData, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        genealogyAddress,
        genealogyABI,
      );

      await contract.createClan(
        formData.clanName,
        formData.ancestorName,
        formData.description,
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

  //---UPLOAD TO IPFS FUNCTION
  const uploadToIPFS = async (file) => {
    try {
      const added = await client.add({ content: file });
      // console.log("=====>: " + added);
      const url = `https://ipfs.io/ipfs/${added.path}`;

      return url;
    } catch (error) {
      console.log("Error uploading to IPFS: ", error);
      // setOpenError(true), setError("Error uploading to IPFS: ", error);
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

  const createProductInfo = async (
    brandAddress,
    productUri,
    callBack,
    handleErr,
  ) => {
    if (feeInfo) {
      const brandFee = feeInfo[2];
      const value = brandFee;
      try {
        const contract = await connectingWithSmartContract(
          supplyAddress,
          supplyABI,
        );

        await contract.createProductInfo(productUri, {
          value: value.toString(),
        });

        contract.on("ProductInfoCreated", async (_brandAddress, newId) => {
          // console.log("_brandAddress = ", _brandAddress, ", newId = ", newId);

          if (brandAddress == _brandAddress) {
            callBack(newId.toNumber());
          }
        });
      } catch (error) {
        handleErr("Error", error);
      }

      // console.log(result);
    } else {
      handleErr("Error", "Cannot get brand's fee");
    }
  };

  const rejectPartner = async (
    walletAddress,
    partnerAddress,
    callBack,
    handleErr,
  ) => {
    if (feeInfo) {
      const brandFee = feeInfo[2];
      const value = brandFee;
      try {
        const contract = await connectingWithSmartContract(
          supplyAddress,
          supplyABI,
        );

        await contract.rejectPartner(partnerAddress, {
          value: value.toString(),
        });

        contract.on("PartnerRejected", async (supplier, agentAddress) => {
          // console.log("_brandAddress = ", _brandAddress, ", newId = ", newId);

          if (walletAddress == supplier && partnerAddress == agentAddress) {
            // updatePartnerInfoDB(
            //   walletAddress,
            //   partnerAddress,
            //   { sts: "refused", timeStamp: new Date().getTime() },
            //   callBack,
            //   handleErr,
            // );
            callBack();
          }
        });
      } catch (error) {
        handleErr("Error", error);
      }

      // console.log(result);
    } else {
      handleErr("Error", "Cannot get brand's fee");
    }
  };

  const transferOwnershipProduct = async (
    brandAddress,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(
        productAddress,
        productABI,
      );

      await contract.transferOwnership(productAddress);

      contract.on("OwnershipTransferred", async (previousOwner, newOwner) => {
        // console.log("_brandAddress = ", _brandAddress, ", newId = ", newId);

        if (brandAddress == previousOwner && productAddress == newOwner) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const enableProductInfo = async (
    brandAddress,
    productId,
    callBack,
    handleErr,
  ) => {
    if (feeInfo) {
      const brandFee = feeInfo[2];
      const value = brandFee;
      try {
        const contract = await connectingWithSmartContract(
          supplyAddress,
          supplyABI,
        );

        await contract.enableProductInfo(productId, {
          value: value.toString(),
        });

        contract.on("ProductInfoEnabled", async (_brandAddress, _productId) => {
          if (brandAddress == _brandAddress && productId == _productId) {
            // callBack(brandAddress, productId);
            updateProductInfo(
              brandAddress,
              productId,
              { isActive: true },
              callBack,
              handleErr,
            );
            // .catch((error) => {
            //   toast.error("Error, Try Again");
            // });
          }
        });
      } catch (error) {
        handleErr("Error", error);
      }
      // console.log(result);
    } else {
      handleErr("Error", "Cannot get brand's fee");
    }
  };

  const disableProductInfo = async (
    brandAddress,
    productId,
    callBack,
    handleErr,
  ) => {
    console.log("661: ", feeInfo);

    if (feeInfo) {
      const brandFee = feeInfo[2];
      const value = brandFee;
      try {
        const contract = await connectingWithSmartContract(
          supplyAddress,
          supplyABI,
        );

        await contract.disableProductInfo(productId, {
          value: value.toString(),
        });

        contract.on(
          "ProductInfoDisabled",
          async (_brandAddress, _productId) => {
            if (brandAddress == _brandAddress && productId == _productId) {
              updateProductInfo(
                brandAddress,
                productId,
                { isActive: false },
                callBack,
                handleErr,
              );
            }
          },
        );
      } catch (error) {
        handleErr("Error", error);
      }
    } else {
      handleErr("Error", "Cannot get brand's fee");
    }
  };

  const brandRegister = async (userWalletAddress, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        supplyAddress,
        supplyABI,
      );

      await contract.brandRegister();
      contract.on("BrandRegistered", async (supplierAddress) => {
        if (userWalletAddress == supplierAddress) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const removeProduct = async (
    userWalletAddress,
    productId,
    callBack,
    handleErr,
  ) => {
    try {
      console.log(
        "userWalletAddress: ",
        userWalletAddress,
        " | productId: ",
        productId,
      );

      const contract = await connectingWithSmartContract(
        productAddress,
        productABI,
      );

      await contract.removeProduct(productId);
      contract.on("ProductRemoved", async (brand, product) => {
        if (userWalletAddress == brand && productId == product) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const addProduct = async (
    userWalletAddress,
    productId,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(
        productAddress,
        productABI,
      );

      await contract.addProduct(productId);
      contract.on("ProductAdded", async (brand, product) => {
        if (userWalletAddress == brand && productId == product) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
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

  const getNFTInfo = async (nftAddress) => {
    try {
      const productContract = connectingSmartContractByPrivatekey(
        productAddress,
        productItemABI,
      );
      const isLSP8Supported = await productContract.supportsInterface(
        INTERFACE_IDS.LSP8IdentifiableDigitalAsset,
      );

      const ownerOfProduct = await productContract.owner();

      // console.log("ownerOfProduct: ", ownerOfProduct);

      const productMetadata = await fetchContractData(
        productAddress,
        lsp4Schema,
        "LSP4Metadata",
      );
      const productName = await fetchContractData(
        productAddress,
        lsp4Schema,
        "LSP4TokenName",
      );
      const productType = await fetchContractData(
        productAddress,
        lsp4Schema,
        "LSP4TokenType",
      );

      return {
        sts: true,
        data: {
          isCollection: productType.value == 2 && isLSP8Supported,
          productMetadata: JSON.stringify(productMetadata, null, 2),
          productName: productName.value,
          ownerOfProduct: ownerOfProduct,
        },
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };
  const getProductItemAmount = async (productAddress) => {
    try {
      const productContract = connectingSmartContractByPrivatekey(
        productAddress,
        productItemABI,
      );
      const amount = await productContract.totalSupply();

      return {
        sts: true,
        data: amount.toNumber(),
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const getProductCount = async (seller) => {
    try {
      const marketContract = connectingSmartContractByPrivatekey(
        productAddress,
        productABI,
      );
      const amount = await marketContract.getProductCount(seller);

      return {
        sts: true,
        data: amount.toNumber(),
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const getProductIdBatch = async (seller, index) => {
    try {
      const productContract = connectingSmartContractByPrivatekey(
        productAddress,
        productABI,
      );
      const productIds = await productContract.getProductIdBatch(seller, index);

      return {
        sts: true,
        data: productIds,
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const getOwnerOfProduct = async (productId) => {
    try {
      const productContract = connectingSmartContractByPrivatekey(
        productAddress,
        productABI,
      );
      const brandId = await productContract.getOwnerOfProduct(productId);

      return {
        sts: true,
        data: brandId,
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  // const fetchTokenIdMetadata()

  const fetchProductItemOfBrand = async (brandId, productId) => {
    try {
      const productItemContract = connectingSmartContractByPrivatekey(
        productId,
        productItemABI,
      );

      // const hex = ethers.utils.hexValue(index);
      // const itemId = ethers.utils.hexZeroPad(hex, 32);
      // console.log("itemId: ", itemId);
      const productItemIds = await productItemContract.tokenIdsOf(brandId);

      const productItems = [];
      await Promise.all(
        productItemIds.map(async (itemId) => {
          // const tokenIdMetadata = await productItemContract.getDataForTokenId(
          //   el,
          //   ERC725YDataKeys.LSP4["LSP4Metadata"]
          // );
          // // console.log("tokenIdMetadata: ", tokenIdMetadata);

          // const erc725js = new ERC725(lsp4Schema);

          // // Decode the metadata
          // const decodedMetadata = erc725js.decodeData([
          //   {
          //     keyName: "LSP4Metadata",
          //     value: tokenIdMetadata,
          //   },
          // ]);
          // const metadataURL = decodedMetadata[0].value.url;

          // const metadataJsonLink = generateMetadataLink(metadataURL);
          // // console.log("metadataJsonLink: ", metadataJsonLink);
          // // Fetch the URL
          // if (metadataJsonLink) {
          //   const response = await fetch(metadataJsonLink);
          //   const jsonMetadata = await response.json();
          //   // console.log("Metadata Contents: ", jsonMetadata?.LSP4Metadata);
          //   // return {
          //   //   sts: true,
          //   //   data: jsonMetadata?.LSP4Metadata,
          //   // };
          //   productItems.push(jsonMetadata?.LSP4Metadata);
          // }
          // const productItem = await _getProductItemInfo(productId, itemId);

          const productItem = {
            ...(await _getProductItemInfo(productId, itemId)),
            id: itemId,
          };

          productItems.push(productItem);
        }),
      );
      return { sts: true, data: productItems };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const fetchProductOfSeller = async (saleId) => {
    try {
      const saleContract = connectingSmartContractByPrivatekey(
        saleAddress,
        saleABI,
      );

      // const hex = ethers.utils.hexValue(index);
      // const itemId = ethers.utils.hexZeroPad(hex, 32);
      // console.log("itemId: ", itemId);
      const saleDetail = await saleContract.getSaleInfo(saleId);

      console.log("saleDetail: ", saleDetail);

      // const productItemContract = connectingSmartContractByPrivatekey(
      //   saleDetail.productId,
      //   productItemABI
      // );

      const productItemIds = await saleContract.getProductItemIds(saleId);
      const productName = await fetchContractData(
        saleDetail.productId,
        lsp4Schema,
        "LSP4TokenName",
      );

      const productDetails = [];
      await Promise.all(
        productItemIds.map(async (itemId) => {
          // const tokenIdMetadata = await productItemContract.getDataForTokenId(
          //   el,
          //   ERC725YDataKeys.LSP4["LSP4Metadata"]
          // );
          // // console.log("tokenIdMetadata: ", tokenIdMetadata);

          // const erc725js = new ERC725(lsp4Schema);

          // // Decode the metadata
          // const decodedMetadata = erc725js.decodeData([
          //   {
          //     keyName: "LSP4Metadata",
          //     value: tokenIdMetadata,
          //   },
          // ]);
          // const metadataURL = decodedMetadata[0].value.url;

          // const metadataJsonLink = generateMetadataLink(metadataURL);
          // // console.log("metadataJsonLink: ", metadataJsonLink);
          // // Fetch the URL
          // if (metadataJsonLink) {
          //   const response = await fetch(metadataJsonLink);
          //   const jsonMetadata = await response.json();
          //   // console.log("Metadata Contents: ", jsonMetadata?.LSP4Metadata);
          //   // return {
          //   //   sts: true,
          //   //   data: jsonMetadata?.LSP4Metadata,
          //   // };
          //   productItem.push(jsonMetadata?.LSP4Metadata);
          // }
          const productItem = await _getProductItemInfo(
            saleDetail.productId,
            itemId,
          );

          const productItemInfo = await saleContract.getProductItemInfo(
            saleId,
            itemId,
          );

          const saleInfo = {
            amount: productItemInfo?.amount.toNumber(),
            price: toEthersUsdtDisplay(productItemInfo?.price),
            sold: productItemInfo?.sold.toNumber(),
          };

          productDetails.push({
            productItem: productItem,
            saleInfo: saleInfo,
          });
        }),
      );
      return {
        sts: true,
        data: {
          productDetails: productDetails,
          saleDetail: saleDetail,
          productItemIds: productItemIds,
          productName: productName?.value,
        },
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const getSaleItem = async (saleId) => {
    try {
      const saleContract = connectingSmartContractByPrivatekey(
        saleAddress,
        saleABI,
      );

      const saleDetail = await saleContract.getSaleInfo(saleId);

      const productItemId = await saleContract.getProductItemId(saleId, 1);

      // const productItem = await _getProductItemInfo(
      //   saleDetail.productId,
      //   productItemId
      // );

      const productItemInfo = await saleContract.getProductItemInfo(
        saleId,
        productItemId,
      );

      const saleInfo = {
        amount: productItemInfo?.amount.toNumber(),
        // price: ethers.utils.formatUnits(productItemInfo?.price, 18),
        price: toEthersUsdtDisplay(productItemInfo?.price),
        sold: productItemInfo?.sold.toNumber(),
      };

      // const productContract = connectingSmartContractByPrivatekey(
      //   saleDetail.productId,
      //   productItemABI
      // );
      const productMetadata = await fetchContractData(
        saleDetail.productId,
        lsp4Schema,
        "LSP4Metadata",
      );
      const productName = await fetchContractData(
        saleDetail.productId,
        lsp4Schema,
        "LSP4TokenName",
      );

      return {
        sts: true,
        data: {
          productName: productName?.value,
          productMetadata: productMetadata,
          saleDetail: saleDetail,
          saleInfo: saleInfo,
          productItemId: productItemId,
        },
      };
    } catch (error) {
      console.log("error: ", error);
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const _getProductItemInfo = async (productId, itemId) => {
    const productItemContract = connectingSmartContractByPrivatekey(
      productId,
      productItemABI,
    );
    const tokenIdMetadata = await productItemContract.getDataForTokenId(
      itemId,
      ERC725YDataKeys.LSP4["LSP4Metadata"],
    );
    // console.log("tokenIdMetadata: ", tokenIdMetadata);

    const erc725js = new ERC725(lsp4Schema);

    // Decode the metadata
    const decodedMetadata = erc725js.decodeData([
      {
        keyName: "LSP4Metadata",
        value: tokenIdMetadata,
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
      return jsonMetadata?.LSP4Metadata;
    } else {
      return null;
    }
  };
  const getProductItemIndex = async (sellerId, productId, productItemId) => {
    try {
      const saleContract = connectingSmartContractByPrivatekey(
        saleAddress,
        saleABI,
      );

      // // Tương đương abi.encodePacked(seller, productId)
      // const encoded = ethers.utils.defaultAbiCoder.encode(
      //   ["address", "address"], // hoặc "uint256" nếu productId là số
      //   [sellerId, productId]
      // );

      // const saleId = ethers.utils.keccak256(encoded);

      const productItemIndex = await saleContract.getProductItemIndex(
        saleId,
        productItemId,
      );

      return {
        sts: true,
        data: productItemIndex.toNumber(),
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const getProductItemInfo = async (saleId, productItemId) => {
    try {
      const saleContract = connectingSmartContractByPrivatekey(
        saleAddress,
        saleABI,
      );

      // // Tương đương abi.encodePacked(seller, productId)
      // const encoded = ethers.utils.defaultAbiCoder.encode(
      //   ["address", "address"], // hoặc "uint256" nếu productId là số
      //   [sellerId, productId]
      // );

      // const saleId = ethers.utils.solidityKeccak256(
      //   ["address", "address"], // hoặc "uint256" nếu productId là số
      //   [sellerId, productId]
      // );

      // console.log("encoded: ", encoded);

      // const saleId = ethers.utils.keccak256(encoded);

      // console.log("saleId: ", saleId, " | productItemId: ", productItemId);

      const productItemInfo = await saleContract.getProductItemInfo(
        saleId,
        productItemId,
      );

      console.log(
        "978. productItemInfo: ",
        toEthersUsdtDisplay(productItemInfo?.price),
      );

      return {
        sts: true,
        data: {
          amount: productItemInfo?.amount.toNumber(),
          price: toEthersUsdtDisplay(productItemInfo?.price),
          sold: productItemInfo?.sold.toNumber(),
        },
      };
    } catch (error) {
      return { sts: false, data: error };
      // console.log("error = ", error);
    }
  };

  const createSale = async (
    sellerId,
    productId,
    productItemIds,
    amounts,
    prices,
    callBack,
    handleErr,
  ) => {
    console.log("999. sellerId: ", sellerId);
    console.log("999. productId: ", productId);
    console.log("999. productItemIds: ", productItemIds);
    console.log("999. amounts: ", amounts);
    console.log("999. prices: ", prices);

    try {
      const saleContract = await connectingWithSmartContract(
        saleAddress,
        saleABI,
      );

      // console.log("marketContract: ", marketContract);

      await saleContract.createSaleItem(
        productId,
        productItemIds,
        amounts,
        prices,
      );

      saleContract.on("SaleCreated", async (sellerId_, productId_) => {
        if (sellerId == sellerId_ && productId == productId_) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const updateSaleItem = async (
    sellerId,
    productId,
    productItemIds,
    amounts,
    prices,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(saleAddress, saleABI);

      const saleId = ethers.utils.solidityKeccak256(
        ["address", "address"], // hoặc "uint256" nếu productId là số
        [sellerId, productId],
      );

      await contract.updateSaleItem(saleId, productItemIds, amounts, prices);
      contract.on("UpdateSaleItem", async (saleId_) => {
        if (saleId == saleId_) {
          // const postSaleData = {
          //   qty: amount,
          //   price: price,
          // };

          // // const newSalePostKey = push(ref(firebase, "sales")).key;

          // // update(ref(firebase, `sales/${_saleId.toNumber()}`), postSaleData);
          // updateSaleItemDB(saleId, postSaleData, callBack, handleErr);
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  // const getSaleCount = async () => {
  //   try {
  //     const saleContract = connectingSmartContractByPrivatekey(
  //       saleAddress,
  //       saleABI,
  //     );

  //     const saleCount = await saleContract.getSaleCount();

  //     return {
  //       sts: true,
  //       data: saleCount.toNumber(),
  //     };
  //   } catch (error) {
  //     return { sts: false, data: error };
  //     // console.log("error = ", error);
  //   }
  // };

  // const getSaleIdBatch = async (indexes) => {
  //   try {
  //     const saleContract = connectingSmartContractByPrivatekey(
  //       saleAddress,
  //       saleABI,
  //     );

  //     const saleIds = await saleContract.getSaleIdBatch(indexes);

  //     return {
  //       sts: true,
  //       data: saleIds,
  //     };
  //   } catch (error) {
  //     return { sts: false, data: error };
  //     // console.log("error = ", error);
  //   }
  // };

  // const getSaleIndex = async (sellerId, productId) => {
  //   try {
  //     const saleContract = connectingSmartContractByPrivatekey(
  //       saleAddress,
  //       saleABI,
  //     );

  //     // // Tương đương abi.encodePacked(seller, productId)
  //     // const encoded = ethers.utils.defaultAbiCoder.encode(
  //     //   ["address", "address"], // hoặc "uint256" nếu productId là số
  //     //   [sellerId, productId]
  //     // );

  //     // const saleId = ethers.utils.keccak256(encoded);
  //     // console.log("saleId: ", saleId);
  //     const saleId = ethers.utils.solidityKeccak256(
  //       ["address", "address"], // hoặc "uint256" nếu productId là số
  //       [sellerId, productId],
  //     );

  //     const saleIndex = await saleContract.getSaleIndex(saleId);

  //     return {
  //       sts: true,
  //       data: saleIndex.toNumber(),
  //     };
  //   } catch (error) {
  //     return { sts: false, data: error };
  //     // console.log("error = ", error);
  //   }
  // };

  // const getSaleOfSellerCount = async (seller) => {
  //   try {
  //     const saleContract = connectingSmartContractByPrivatekey(
  //       saleAddress,
  //       saleABI,
  //     );
  //     const amount = await saleContract.getSaleOfSellerCount(seller);

  //     return {
  //       sts: true,
  //       data: amount.toNumber(),
  //     };
  //   } catch (error) {
  //     return { sts: false, data: error };
  //     // console.log("error = ", error);
  //   }
  // };

  // const getSaleIdOfSeller = async (seller, index) => {
  //   try {
  //     const saleContract = connectingSmartContractByPrivatekey(
  //       saleAddress,
  //       saleABI,
  //     );
  //     const saleId = await saleContract.getSaleIdOfSeller(seller, index);

  //     return {
  //       sts: true,
  //       data: saleId,
  //     };
  //   } catch (error) {
  //     return { sts: false, data: error };
  //     // console.log("error = ", error);
  //   }
  // };

  const approveProduct = async (
    brand,
    seller,
    productId,
    productItemIds,
    amounts,
    callBack,
    handleErr,
  ) => {
    console.log(`brandId: `, brand);
    console.log(`sellerId: `, seller);
    console.log(`productId: `, productId);
    console.log(`Sản phẩm productItemIds: `, productItemIds);
    console.log(`Sản phẩm amounts: `, amounts);
    try {
      const contract = await connectingWithSmartContract(saleAddress, saleABI);
      // console.log(convertEtherToWei(price.toString()));
      await contract.approveProduct(seller, productId, productItemIds, amounts);
      contract.on("ApproveProduct", async (brand_, seller_, productId_) => {
        if (brand == brand_ && seller == seller_ && productId == productId_) {
          // const postApproveData = {
          //   brandId: item.brandId,
          //   productId: item.productId,
          //   productName: item?.productName ?? "",
          //   productTitle: item?.productTitle ?? "n/a",
          //   categoryId: item.categoryId ?? "root",
          //   desc: item.desc ?? "n/a",
          //   image: item.images[0].imageURL,
          //   isActive: false,
          //   qty: qty,
          //   returnDay: returnDay ?? 0,
          //   // cashOnDelivery: cashOnDelivery ?? true,
          //   // tokenPay: tokenPay ?? true,
          //   price: price,
          //   sellerId: sellerId ?? "",
          // };
          // updateAproveDB(
          //   saleId.toNumber(),
          //   postApproveData,
          //   callBack,
          //   handleErr
          // );
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  // const getProductAllowance = async (sellerId, productId, productItemId) => {
  //   try {
  //     const saleContract = connectingSmartContractByPrivatekey(
  //       saleAddress,
  //       saleABI,
  //     );

  //     const saleId = ethers.utils.solidityKeccak256(
  //       ["address", "address"], // hoặc "uint256" nếu productId là số
  //       [sellerId, productId],
  //     );

  //     const allowance = await saleContract.getProductAllowance(
  //       saleId,
  //       productItemId,
  //     );

  //     return {
  //       sts: true,
  //       data: allowance.toNumber(),
  //     };
  //   } catch (error) {
  //     return { sts: false, data: error };
  //     // console.log("error = ", error);
  //   }
  // };

  const purchaseAccepted = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.purchaseAccepted(item.purchaseId);
      contract.on("EventPurchaseAccepted", async (purchaseId, timeStamp) => {
        if (item.purchaseId == purchaseId.toNumber()) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: SELLER_ACCEPTED,
              timeStamp: timeStamp,
            },
            "Accepted",
            item.sellerId,
            item.buyerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const purchaseShipped = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.purchaseShipped(item.purchaseId, item.refData);
      contract.on("EventPurchaseShipped", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: SHIPPER_SHIPPED,
            },
            "Shipped",
            item.sellerId,
            item.buyerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const buyerCancel = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      const cancelReason = ethers.utils.formatBytes32String(
        item.cancelReason || "n/a",
      );

      await contract.buyerCancel(item.purchaseId, cancelReason);
      contract.on("EventBuyerCanceled", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: BUYER_CANCELED,
              reasonCancel: item.cancelReason || "n/a",
            },
            "canceled",
            item.buyerId,
            item.sellerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const sellerCancel = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.sellerCancel(item.purchaseId);
      contract.on("EventSellerCanceled", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: SELLER_CANCELED,
              reasonCancel: item.cancelReason,
            },
            "Canceled",
            item.sellerId,
            item.buyerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const buyerReceived = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.buyerReceived(item.purchaseId);
      contract.on("EventPurchaseReceived", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: BUYER_RECEIVED,
            },
            "Received",
            item.buyerId,
            item.sellerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const buyerNotReceived = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.buyerNotReceived(item.purchaseId, item.refData);
      contract.on("EventPurchaseNotReceived", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: BUYER_NOT_RECEIVED,
              refData: item.refData,
            },
            "not_received",
            item.buyerId,
            item.sellerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const purchaseDelivered = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.purchaseShipped(item.purchaseId, item.refData);
      contract.on("EventPurchaseShipped", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: SHIPPER_DELIVERED,
            },
            "Delivered",
            item.sellerId,
            item.buyerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const purchaseDeliveryFailure = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.shipperDeliveryFailure(item.purchaseId);
      contract.on("EventPurchaseShipFailure", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: SHIPPER_DELIVERY_FAILURE,
            },
            "Delivered fail",
            item.sellerId,
            item.buyerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const confirmDeliveryFailure = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.confirmDeliveryFailure(item.purchaseId);
      contract.on("EventConfirmDeliveryFailure", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: BUYER_CONFIRM_DELIVERY_FAILURE,
            },
            "Confirm delivered",
            item.buyerId,
            item.sellerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const confirmNotReceived = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.confirmNotReceived(item.purchaseId);
      contract.on("EventConfirmNotReceived", async (purchaseId) => {
        if (item.purchaseId == purchaseId) {
          updatePurchaseDB(
            item.id,
            {
              currentSTS: SELLER_CONFIRM_NOT_RECEIVED,
            },
            "confirm_not_received",
            item.sellerId,
            item.buyerId,
            callBack,
            handleErr,
          );
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const releaseFunds = async (item, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.releaseFunds(item.purchaseId);
      contract.on("EventReleaseFunds", async (id) => {
        if (purchaseId == id) {
          callBack();
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const purchaseRating = async (
    purchaseId,
    sellerPoint,
    productIds,
    points,
    callBack,
    handleErr,
  ) => {
    console.log(purchaseId, sellerPoint, productIds, points);

    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );

      await contract.rateSeller(purchaseId, sellerPoint);
      contract.on("RateSeller", async (id) => {
        if (purchaseId == id) {
          rateProduct(purchaseId, productIds, points, callBack, handleErr);
        }
      });
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const getPurchaseInfo = async (purchaseId) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );
      const purchaseInfo = await contract.purchases(purchaseId);
      return { sts: true, data: purchaseInfo };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getProductRate = async (brandAddress, productId) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );
      const result = await contract.productRate(brandAddress, productId);
      return {
        sts: true,
        data: { rate: result.rate.toNumber(), count: result.count.toNumber() },
      };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getProductRatePermitted = async (purchaseId) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );
      const productRatePermitted =
        await contract.productRatePermitted(purchaseId);
      return { sts: true, data: productRatePermitted };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getSellerRatePermitted = async (purchaseId) => {
    try {
      const contract = await connectingWithSmartContract(
        marketAddress,
        marketABI,
      );
      const sellerRatePermit = await contract.sellerRatePermitted(purchaseId);
      return { sts: true, data: sellerRatePermit };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  return (
    <GenealogyContext.Provider
      value={{
        checkIfWalletConnected,
        getNFTInfo,
        createClan,
        getClanInfo,
        uploadToIPFS,

        getUserProfile,

        createProductInfo,

      
        rejectPartner,

        enableProductInfo,
        disableProductInfo,

        transferOwnershipProduct,

        addProduct,
        removeProduct,
        getNFTCollection,

        approveProduct,

        createSale,
        updateSaleItem,

        brandRegister,

        purchaseAccepted,

        buyerCancel,
        sellerCancel,
        buyerReceived,
        buyerNotReceived,
        purchaseShipped,
        purchaseDeliveryFailure,
        purchaseDelivered,
        confirmDeliveryFailure,
        confirmNotReceived,
        releaseFunds,

        purchaseRating,

        getPurchaseInfo,
        getProductRate,
        getProductRatePermitted,
        getSellerRatePermitted,

        updateFeeInfo,
      }}
    >
      {children}
    </GenealogyContext.Provider>
  );
};
