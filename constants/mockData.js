export const initialFamilyData = [
  // THẾ HỆ 1: Khởi tổ
  {
    id: "1",
    name: "Nguyễn Văn Tổ",
    gender: "male",
    birthYear: "1900",
    deathYear: "1975",
    shortDesc: "Khởi tổ dòng họ, khai hoang lập ấp tại vùng đất phía Nam.",
    parents: [],
    // Danh sách các phu nhân được gom vào đây
    spouses: [
      {
        id: "2",
        name: "Lê Thị Tổ",
        birthYear: "1905",
        deathYear: "1980",
        shortDesc: "Mẫu nghi chính thất, thục đức vẹn toàn.",
      },
    ],
  },
  // THẾ HỆ 2
  {
    id: "3",
    name: "Nguyễn Văn Trưởng",
    gender: "male",
    birthYear: "1925",
    deathYear: "1990",
    shortDesc: "Trưởng tộc đời thứ 2, Lương y nổi tiếng vùng kinh kỳ.",
    parents: ["1"], // Nối trực tiếp từ mã ID của cha
    spouses: [
      {
        id: "4",
        name: "Trần Thị Dâu",
        birthYear: "1928",
        deathYear: "1995",
        shortDesc: "Phụ giúp chồng bốc thuốc cứu người.",
      },
      {
        id: "4",
        name: "Trần Thị Dâu 2",
        birthYear: "1928",
        deathYear: "1995",
        shortDesc: "Phụ giúp chồng bốc thuốc cứu người.",
      },
    ],
  },
  {
    id: "5",
    name: "Lê Văn Rể",
    gender: "male",
    birthYear: "1928",
    deathYear: "2000",
    shortDesc: "Kiến trúc sư tài ba.",
    parents: ["1"],
    spouses: [
      {
        id: "6",
        name: "Nguyễn Thị Thứ",
        birthYear: "1930",
        deathYear: "2005",
        shortDesc: "Định cư tại nước ngoài.",
      },
    ],
  },
  // THẾ HỆ 3
  {
    id: "7",
    name: "Nguyễn Đích Tôn",
    gender: "male",
    birthYear: "1955",
    shortDesc: "Giáo sư sử học, đương kim Trưởng tộc.",
    parents: ["3"],
    spouses: [
      {
        id: "8",
        name: "Phạm Thị Hiền",
        birthYear: "1960",
        shortDesc: "Giáo viên ưu tú.",
      },
    ],
  },
  {
    id: "9",
    name: "Nguyễn Văn Cháu Thứ",
    gender: "male",
    birthYear: "1962",
    parents: ["3"],
  },
  {
    id: "10",
    name: "Lê Thị Cháu Ngoại",
    gender: "female", // Node nữ đơn lẻ (nếu có)
    birthYear: "1958",
    parents: ["5"],
  },
  // THẾ HỆ 4
  {
    id: "11",
    name: "Nguyễn Văn Chắt Trai",
    gender: "male",
    birthYear: "1985",
    shortDesc: "Kỹ sư phần mềm (Người tạo ra bản số hóa này).",
    parents: ["7"],
  },
  {
    id: "12",
    name: "Nguyễn Thị Chắt Gái",
    gender: "female",
    birthYear: "1990",
    parents: ["7"],
  },
  {
    id: "20",
    name: "Nguyễn Thị Chắt Gái 2",
    gender: "female",
    birthYear: "1990",
    parents: ["7"],
  },
  {
    id: "21",
    name: "Nguyễn Thị Chắt Gái 3",
    gender: "female",
    birthYear: "1990",
    parents: ["7"],
  },
  {
    id: "22",
    name: "Nguyễn Thị Chắt Gái 4",
    gender: "female",
    birthYear: "1990",
    parents: ["7"],
  },
  {
    id: "23",
    name: "Lê Thị Chắt Gái 3",
    gender: "female",
    birthYear: "1990",
    parents: ["10"],
  },
  {
    id: "24",
    name: "Lê Thị Chắt Gái 4",
    gender: "female",
    birthYear: "1990",
    parents: ["10"],
  },
];
