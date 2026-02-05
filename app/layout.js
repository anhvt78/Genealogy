import "./globals.css";

export const metadata = {
  title: "Gia Phả Tộc - Truyền Thống Việt",
  description: "Hệ thống quản lý gia phả số phong cách cổ điển",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
