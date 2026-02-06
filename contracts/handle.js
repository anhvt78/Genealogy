import { ethers } from "ethers";
export const getProviderName = () => {
  if (window.ethereum) {
    if (window.ethereum.isMetaMask) {
      return "MetaMask";
    } else if (window.ethereum.isTrust) {
      return "Trust Wallet";
    } else if (window.ethereum.isNiftyWallet) {
      return "Nifty Wallet";
    } else if (window.ethereum.walletConnectProvider) {
      return "WalletConnect";
    } else if (window.ethereum.isCoinbaseWallet) {
      return "Coinbase Wallet";
    } else if (window.ethereum.isBraveWallet) {
      return "Brave Wallet";
    } else if (window.ethereum.isStatus) {
      return "Status";
    } else {
      return "Unknown Wallet";
    }
  } else {
    return "No Ethereum provider found";
  }
};
