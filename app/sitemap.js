// app/sitemap.js

export default async function sitemap() {
  const baseUrl = "https://giaphaviet.top";

  // 1. Danh sách các trang tĩnh cơ bản
  const staticPages = ["", "/page.js", "/pages", "/pages/detail"].flatMap(
    (route) => [
      {
        url: `${baseUrl}/vi${route}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 1,
      },
      {
        url: `${baseUrl}/${route}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ],
  );

  // 2. Danh sách các trang dòng họ động (Dynamic Routes)
  // Giả sử bạn có một API lấy danh sách các clanId
  let clanPages = [];
  try {
    // Thay thế URL này bằng API thực tế của bạn
    // const response = await fetch('https://api.giaphaviet.vn/clans');
    // const clans = await response.json();

    // Ví dụ giả lập dữ liệu:
    const clans = [{ id: "0x123..." }, { id: "0x456..." }];

    clanPages = clans.flatMap((clan) => [
      {
        url: `${baseUrl}/pages/detail/${clan.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
      //   {
      //     url: `${baseUrl}/en/pages/detail/${clan.id}`,
      //     lastModified: new Date(),
      //     changeFrequency: "weekly",
      //     priority: 0.6,
      //   },
    ]);
  } catch (error) {
    console.error("Lỗi khi tạo sitemap cho dòng họ:", error);
  }

  return [...staticPages, ...clanPages];
}
