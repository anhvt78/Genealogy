import {
  LUKSO_CHAIN_ID,
  LUKSO_RPC_URL,
  // BRAND_NFT_CURRENCY,
  // GAMEFI_NFT_CURRENCY,
  NETWORK,
} from "@/constants";
import { ethers } from "ethers";
import sweetalert2 from "@/configs/swal";

export const httpService = (cb) => {
  return async (options, thunkApi) => {
    try {
      const res = await cb(options, thunkApi);
      return res.data;
    } catch (error) {
      throw thunkApi.rejectWithValue(error);
    }
  };
};

export const maskWalletAddress = (wallet) => {
  if (wallet) {
    const headChars = wallet.substring(0, 7);
    const endChars = wallet.substring(wallet.length - 5);
    return `${headChars}...${endChars}`;
  }
};

export const fileToBase64 = (file, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    callback(reader.result);
  };
  reader.onerror = (error) => {
    console.error("Error: ", error);
  };
};

// export const priceWithUSDCurrency = (ethValue, rate) => {
//   const convertedPrice = convertETHToUSD(ethValue, rate);
//   return `${convertedPrice.toString()} ${BRAND_NFT_CURRENCY}`;
// };

// export const priceWithCWCurrency = (value) => {
//   return value ? `${value} ${GAMEFI_NFT_CURRENCY}` : " ";
// };

// export const convertToEthers = (weiValue) => ethers.utils.formatEther(weiValue);

export const convertToEthers = (weiValue) => {
  // Kiểm tra xem weiValue có hợp lệ không
  if (weiValue === undefined || weiValue === null) {
    throw new Error("Invalid input: weiValue is undefined or null");
  }

  try {
    // Đảm bảo weiValue là chuỗi hoặc số hợp lệ
    return ethers.utils.formatEther(weiValue);
  } catch (error) {
    throw new Error(`Failed to convert weiValue to Ether: ${error.message}`);
  }
};

export function roundUpForETH(num, precision) {
  const factor = Math.pow(10, precision);
  return Math.ceil(num * factor) / factor;
}

export function roundUpForUSD(num, precision) {
  const factor = Math.pow(10, precision);
  return (Math.ceil(num * factor) / factor).toFixed(precision);
}

export const convertUnixTimestampToDays = (unixTimestamp) => {
  const currentDate = new Date(); // Ngày hiện tại
  const timestampDate = new Date(unixTimestamp * 1000); // Chuyển đổi sang millisecond

  // Tính khoảng cách thời gian (millisecond)
  const differenceInTime = currentDate - timestampDate;

  // Chuyển đổi millisecond sang số ngày
  const differenceInDays = Math.floor(differenceInTime / (1000 * 60 * 60 * 24));

  return differenceInDays;
};

export const convertMilliseconds = (sc) => {
  // const millisecondsInASecond = 1000;
  const millisecondsInAMinute = 60;
  const millisecondsInAnHour = millisecondsInAMinute * 60;
  const millisecondsInADay = millisecondsInAnHour * 24;

  // Tính toán số ngày, giờ, phút, giây
  const days = Math.floor(sc / millisecondsInADay);
  const hours = Math.floor((sc % millisecondsInADay) / millisecondsInAnHour);
  const minutes = Math.floor(
    (sc % millisecondsInAnHour) / millisecondsInAMinute,
  );
  const seconds = Math.floor(sc % millisecondsInAMinute);

  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;

  // return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const formatCustomTimestamp = (unixTimestamp) => {
  const date = new Date(unixTimestamp * 1000);

  const day = date.getDate();
  const month = date.getMonth() + 1; // Tháng bắt đầu từ 0
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Định dạng: dd/mm/yyyy hh:mm:ss
  return `${day}/${month}/${year} ${hours < 10 ? `0${hours}` : hours}:${
    minutes < 10 ? `0${minutes}` : minutes
  }:${seconds < 10 ? `0${seconds}` : seconds}`;
};

export const timeStampToDate = (timeStamp) => {
  const date = new Date(timeStamp);

  const day = date.getDate();
  const month = date.getMonth() + 1; // Tháng bắt đầu từ 0
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Định dạng: dd/mm/yyyy hh:mm:ss
  return `${hours < 10 ? `0${hours}` : hours}:${
    minutes < 10 ? `0${minutes}` : minutes
  }:${seconds < 10 ? `0${seconds}` : seconds} ${day}-${month}-${year} `;
};

export const convertUSDToETH = (value, rate) => {
  const eth = value / rate;
  return roundUpForETH(eth, 4);
};

export const convertETHToUSD = (value, rate) => {
  return roundUpForUSD(value * rate, 2);
};

export const randomUUID = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const date = (value) => dayjs(value);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const setLoadingProgress = (value) => {
  if (value) {
    NProgress.start();
  } else {
    NProgress.done();
  }
};

// export const logout = () => {
//   store.dispatch({ type: 'session/clearSession' })
//   store.dispatch({ type: 'favorite/clearFavorites' })
//   store.dispatch({ type: 'cart/clearCart' })
//   store.dispatch({ type: 'chatBox/reset'});
// }

// export const getMe = async () => {
//   await Axios.get(apiRoutes.auth.me);
// };

export const handleKeyDownNumberInput = (event) => {
  const inputValue = event.target.value;
  // Allow navigation keys: backspace, delete, tab, escape, enter
  const navigationKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter"];
  // Allow arrow keys
  const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (
    !(
      // Check if key is a number
      (
        (event.key >= "0" && event.key <= "9") ||
        // Allow decimal point if there is no existing decimal in the input value
        (event.key === "." && !inputValue.includes(".")) ||
        // Allow navigation keys
        navigationKeys.includes(event.key) ||
        // Allow arrow keys
        arrowKeys.includes(event.key)
      )
    )
  ) {
    event.preventDefault();
  }

  // If the input value already contains a decimal point, check for two decimal places
  const cursorPosition = event.target.selectionStart;
  if (inputValue.includes(".") && cursorPosition > inputValue.indexOf(".")) {
    const decimalPart = inputValue.split(".")[1];
    if (
      decimalPart &&
      decimalPart.length >= 2 &&
      event.key >= "0" &&
      event.key <= "9"
    ) {
      event.preventDefault();
    }
  }
};

export const handleKeyDownNumberInputWithMax = (event, maxValue) => {
  const inputValue = event.target.value;
  // Allow navigation keys: backspace, delete, tab, escape, enter
  const navigationKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter"];
  // Allow arrow keys
  const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  // Combine navigation and arrow keys
  const allowedKeys = [...navigationKeys, ...arrowKeys];

  // Check if the key is allowed
  if (
    !(
      // Check if key is a number
      (
        (event.key >= "0" && event.key <= "9") ||
        // Allow decimal point if there is no existing decimal in the input value
        (event.key === "." && !inputValue.includes(".")) ||
        // Allow navigation and arrow keys
        allowedKeys.includes(event.key)
      )
    )
  ) {
    event.preventDefault();
    return;
  }

  // If the input value already contains a decimal point, check for two decimal places
  const cursorPosition = event.target.selectionStart;
  if (inputValue.includes(".") && cursorPosition > inputValue.indexOf(".")) {
    const decimalPart = inputValue.split(".")[1];
    if (
      decimalPart &&
      decimalPart.length >= 2 &&
      event.key >= "0" &&
      event.key <= "9"
    ) {
      event.preventDefault();
      return;
    }
  }

  // If the key is a number, check the combined value
  if (event.key >= "0" && event.key <= "9") {
    const newValue = inputValue + event.key;
    if (parseFloat(newValue) > maxValue) {
      event.preventDefault();
    }
  }
};

export const handleKeyDownNumberInputWithoutDecimal = (event) => {
  // Allow navigation keys: backspace, delete, tab, escape, enter
  const navigationKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter"];
  // Allow arrow keys
  const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (
    !(
      // Check if key is a number
      (
        (event.key >= "0" && event.key <= "9") ||
        // Allow navigation keys
        navigationKeys.includes(event.key) ||
        // Allow arrow keys
        arrowKeys.includes(event.key)
      )
    )
  ) {
    event.preventDefault();
  }
};

export const handleKeyDownNumberInputWithoutDecimalMaxValue = (
  event,
  maxValue,
) => {
  // Allow navigation keys: backspace, delete, tab, escape, enter
  const navigationKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter"];
  // Allow arrow keys
  const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

  // Combine navigation and arrow keys
  const allowedKeys = [...navigationKeys, ...arrowKeys];

  // Get the current value of the input
  const inputElement = event.target; // as HTMLInputElement;
  const currentValue = inputElement.value;

  // Check if the key is allowed
  if (
    !(
      // Check if key is a number
      (
        (event.key >= "0" && event.key <= "9") ||
        // Allow navigation and arrow keys
        allowedKeys.includes(event.key)
      )
    )
  ) {
    event.preventDefault();
    return;
  }

  // If the key is a number, check the combined value
  if (event.key >= "0" && event.key <= "9") {
    const newValue = currentValue + event.key;
    if (parseInt(newValue, 10) > maxValue) {
      event.preventDefault();
    }
  }
};

export function isValidUrl(str) {
  const pattern = new RegExp(
    "^([a-zA-Z]+:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR IP (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$", // fragment locator
    "i",
  );
  return pattern.test(str);
}

export const validateSecureInput = (input) => {
  return false;
};

export const checkChainId = async (ethereum) => {
  const chainId = await ethereum.request({ method: "eth_chainId" });
  if (chainId === LUKSO_CHAIN_ID) {
    // console.log("Bravo!, you are on the correct network");
    return true;
  } else {
    return await switchNetwork(ethereum);
  }
};

export const switchNetwork = async (ethereum) => {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LUKSO_CHAIN_ID }],
    });
    // console.log("You have succefully switched to Lukso Smart Chain network");
    return true;
  } catch (switchError) {
    // console.log(
    //   "Failed to switch to the network. Try add the network to metamask"
    // );
    if (switchError.code === 4902) {
      // console.log(
      //   "This network is not available in your metamask, please add it"
      // );

      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NETWORK],
        });

        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: LUKSO_CHAIN_ID }],
        });
        return true;
      } catch (ex) {
        sweetalert2.messageError("Failed to switch to the network");
        return false;
      }
    } else {
      sweetalert2.messageError("Failed to switch to the network");
      return false;
    }
  }
};

export function containsLink(text) {
  // // Regular expression to match URLs
  // const urlRegex = /(https?:\/\/[^\s]+)/g;
  // // Test if the text contains a URL
  // return urlRegex.test(text) ? 'Input should not contain URLs.' : false;
  return false;
}

export function createSymbol(name) {
  const cleanedName = name.replace(/[^a-zA-Z ]/g, "");
  const upperName = cleanedName.toUpperCase();
  const words = upperName.split(" ");
  let symbol = words.map((word) => word.charAt(0)).join("");
  if (symbol.length === 1) {
    symbol = upperName.substring(0, 5);
  } else if (symbol.length > 5) {
    symbol = symbol.substring(0, 5);
  }
  return symbol;
}

export const isMobileChrome = () => {
  return /CriOS/i.test(navigator.userAgent);
};

export const isMobileSafari = () => {
  return (
    /Safari/i.test(navigator.userAgent) && !/CriOS/i.test(navigator.userAgent)
  );
};

export function openMetaMaskUrl(url) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_self";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function toEnglishCharacters(str) {
  const charMap = {
    á: "a",
    à: "a",
    ä: "a",
    â: "a",
    ã: "a",
    å: "a",
    ā: "a",
    é: "e",
    è: "e",
    ë: "e",
    ê: "e",
    ē: "e",
    í: "i",
    ì: "i",
    ï: "i",
    î: "i",
    ī: "i",
    ó: "o",
    ò: "o",
    ö: "o",
    ô: "o",
    õ: "o",
    ø: "o",
    ō: "o",
    ú: "u",
    ù: "u",
    ü: "u",
    û: "u",
    ū: "u",
    ç: "c",
    ñ: "n",
    ß: "ss",
    ÿ: "y",
    Á: "A",
    À: "A",
    Ä: "A",
    Â: "A",
    Ã: "A",
    Å: "A",
    Ā: "A",
    É: "E",
    È: "E",
    Ë: "E",
    Ê: "E",
    Ē: "E",
    Í: "I",
    Ì: "I",
    Ï: "I",
    Î: "I",
    Ī: "I",
    Ó: "O",
    Ò: "O",
    Ö: "O",
    Ô: "O",
    Õ: "O",
    Ø: "O",
    Ō: "O",
    Ú: "U",
    Ù: "U",
    Ü: "U",
    Û: "U",
    Ū: "U",
    Ç: "C",
    Ñ: "N",
    Ÿ: "Y",
  };

  return str.replace(/[^\u0000-\u007E]/g, function (char) {
    return charMap[char] || char;
  });
}

export const formatCurrency = (amount) => {
  const formattedAmount = new Number(amount).toLocaleString();
  return <span>{formattedAmount}</span>;
};

export const FormattedPriceUSDT = (value) => {
  // const amount = value * rateUSDT;
  const formattedAmount = new Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
  return <span>{formattedAmount}</span>;
};

export const FormattedSold = (value) => {
  if (value >= 1000000) {
    return <span>{(value / 1000000).toFixed(1)}mil</span>;
  } else if (value >= 1000) {
    return <span>{(value / 1000).toFixed(1)}k</span>;
  } else {
    return <span>{value}</span>;
  }
};

export const FormattedPriceLYX = (valueUsd, rateUSDT) => {
  // const formattedAmount = new Number(amount).toLocaleString("en-US", {
  //   style: "currency",
  //   currency: "LYX",
  //   maximumFractionDigits: 6,
  // });
  const value = valueUsd / rateUSDT;
  return <span>{value.toFixed(4)} lyx</span>;
};

export const fetchLyxUsdtPrice = async () => {
  try {
    const response = await axios.get("http://m2c.com.vn:3001/usdtRate");

    // const response = await axios.get(
    //   "https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=LYX-USDT"
    // );

    // console.log("response = ", response.data);

    if (response.data.sts) {
      return { sts: true, data: response.data.data };
    } else {
      return { sts: false, data: response.data.data };
    }

    // const price = response.data.data.price;
    // console.log(`Tỷ giá BTC/USDT: ${price}`);
  } catch (error) {
    // console.error("Lỗi khi lấy tỷ giá:", error);
    return { sts: false, data: error };
  }
};

export const convertEtherToWei = (etherAmount) =>
  ethers.utils.parseEther(etherAmount);

// export default function convertEtherToWei(etherAmount) {
//   // const etherAmount = "1.5"; // số lượng ether (chuỗi hoặc số)

//   try {
//     const weiAmount = ethers.utils.parseEther(etherAmount);
//     // console.log("Số lượng wei:", weiAmount.toString()); // Kết quả dưới dạng chuỗi
//     return weiAmount;
//   } catch (error) {
//     console.error("Eror:", error.message);
//   }
// }

export const generateMetadataLink = (link) => {
  // If link is a regular Web2 Link, it can be passed back
  if (link?.startsWith("https://") || link?.startsWith("http://")) {
    // Use your default IPFS Gateway address
    return link;
  }
  // If link has custom protocol, adjust the link
  if (link?.startsWith("ipfs://")) {
    // Use your default IPFS Gateway address
    return `https://api.universalprofile.cloud/ipfs/${link?.slice(7)}`;
  } else {
    return null;
  }
};

export const timeStampToLastSeen = (lastSeen) => {
  // console.log("lastSeen = ", lastSeen);

  if (!lastSeen) return "Last seen: n/a";
  const now = Date.now();
  const diffInSeconds = Math.floor((now - lastSeen) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 60) return "Last seen: just now";
  if (diffInHours < 24) return `Last seen: ${diffInHours} hours ago`;
  if (diffInDays < 30) return `Last seen: ${diffInDays} days ago`;
  if (diffInMonths < 12) return `Last seen: ${diffInMonths} months ago`;
  return `Last seen: ${diffInYears} years ago`;
};

export const numberToByte32 = (number) => {
  const hex = ethers.utils.hexValue(number);
  const bytes32 = ethers.utils.hexZeroPad(hex, 32);
  return bytes32;
};

export const convertUSDToUint256 = (priceUSD) => {
  // Chuyển 2.5 USD → wei (10^18)
  const value = ethers.utils.parseUnits(priceUSD, 18);
  return value;
};

export const convertUint256ToUSD = (value) => {
  try {
    // Kiểm tra nếu value là BigNumber hợp lệ

    // console.log("641: value: ", value);

    if (!value || !ethers.BigNumber.isBigNumber(value)) {
      throw new Error("Invalid BigNumber value");
    }
    // Chuyển sang chuỗi thập phân với 18 decimals
    const usdValue = ethers.utils.formatUnits(value, 18);
    console.log("648: usdValue: ", parseFloat(usdValue).toFixed(2));
    // Optional: Làm tròn hoặc format thêm (ví dụ: giữ 2 chữ số thập phân)

    return parseFloat(usdValue).toFixed(2); // Trả về "978.00" thay vì "978.0"
  } catch (error) {
    console.error("Error converting uint256 to USD:", error);
    return "0.00"; // Hoặc throw error tùy nhu cầu
  }
};

export const parseProductMetadata = (metadata) => {
  // const object = JSON.parse(metadata || {}); //.getValue(`${accessorKey}`);
  try {
    let object;
    if (typeof metadata === "string" && metadata.trim() !== "") {
      // Nếu metadata là chuỗi không rỗng, phân tích JSON
      object = JSON.parse(metadata);
    } else if (metadata && typeof metadata === "object") {
      // Nếu metadata đã là đối tượng, sử dụng trực tiếp
      object = metadata;
    } else {
      // Xử lý metadata không hợp lệ
      console.warn("Metadata không hợp lệ hoặc thiếu");
      return null;
    }
    return {
      assets: object?.value?.LSP4Metadata?.assets,
      attributes: object?.value?.LSP4Metadata?.attributes,
      category: object?.value?.LSP4Metadata?.category,
      description: object?.value?.LSP4Metadata?.description,
      icon: object?.value?.LSP4Metadata?.icon,
      images: object?.value?.LSP4Metadata?.images,
      links: object?.value?.LSP4Metadata?.links,
    };
  } catch (error) {
    console.error("Lỗi khi phân tích metadata: ", error);
    return null;
  }
};

export const parseProfileMetadata = (metadata) => {
  try {
    let object;
    if (typeof metadata === "string" && metadata.trim() !== "") {
      // Nếu metadata là chuỗi không rỗng, phân tích JSON
      object = JSON.parse(metadata);
    } else if (metadata && typeof metadata === "object") {
      // Nếu metadata đã là đối tượng, sử dụng trực tiếp
      object = metadata;
    } else {
      // Xử lý metadata không hợp lệ
      console.warn("Metadata không hợp lệ hoặc thiếu");
      return null;
    }

    // console.log("LSP3Profile: ", object?.value?.LSP3Profile);
    return {
      name: object?.value?.LSP3Profile?.name,
      tags: object?.value?.LSP3Profile?.tags,
      description: object?.value?.LSP3Profile?.description,
      profileImage: object?.value?.LSP3Profile?.profileImage,
      backgroundImage: object?.value?.LSP3Profile?.backgroundImage,
      links: object?.value?.LSP3Profile?.links,
    };
  } catch (error) {
    console.error("Lỗi khi phân tích metadata: ", error);
    return null;
  }
};

const usdtDecimals = 6;
export const toEthersUsdtAtomic = (amountString) => {
  // parseUnits(Giá trị, Số thập phân)
  console.log(
    "amountString: ",
    amountString,
    " | usdtDecimals =  ",
    usdtDecimals,
  );

  return ethers.utils.parseUnits(amountString, usdtDecimals);
};

export const toEthersUsdtDisplay = (amount) => {
  // formatUnits(Giá trị atomic, Số thập phân)
  return ethers.utils.formatUnits(amount, usdtDecimals);
};

export const formatDate = (dateData) => {
  console.log("dateData: ", dateData);

  if (!dateData) return "Không rõ";

  // Lấy giá trị year, month, day từ object hoặc array
  // Lưu ý: month trong JS bắt đầu từ 0 (Tháng 1 = 0),
  // nhưng nếu dữ liệu của bạn trả về 0 nghĩa là chưa có dữ liệu hoặc đã đúng số tháng, hãy kiểm tra lại API.
  const day = dateData.day || dateData[0];
  const month = dateData.month || dateData[1];
  const year = dateData.year || dateData[2];

  // Nếu không có năm thì coi như không rõ
  if (!year || year === 0) return "Không rõ";

  // Định dạng hiển thị dd/mm/yyyy (Thêm số 0 phía trước nếu < 10)
  const d = day > 0 ? String(day).padStart(2, "0") : "??";
  const m = month > 0 ? String(month).padStart(2, "0") : "??";
  const y = year;

  return `${d}/${m}/${y}`;
};

export const formatDisplayDate = (dateObj) => {
  if (!dateObj) return "";

  // Nếu tất cả đều là 0, có thể trả về chuỗi trống hoặc "??/??/????" tùy bạn
  // Ở đây tôi xử lý từng thành phần:
  const day = dateObj.day === 0 ? "??" : dateObj.day;
  const month = dateObj.month === 0 ? "??" : dateObj.month;
  const year = dateObj.year === 0 ? "????" : dateObj.year;

  return `${day}/${month}/${year}`;
};
