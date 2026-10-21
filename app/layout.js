import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://openingprofile.vercel.app"),

  title: "오스템임플란트 개원성향진단",

  description:
    "12문항으로 나의 개원 성향을 확인하고 맞춤형 개원 전략과 상담을 받아보세요.",

  openGraph: {
    title: "오스템임플란트 개원성향진단",

    description:
      "12문항으로 나의 개원 성향을 확인하고 맞춤형 개원 전략과 상담을 받아보세요.",

    url: "https://openingprofile.vercel.app",

    siteName: "오스템임플란트 개원성향진단",

    locale: "ko_KR",

    type: "website",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "오스템임플란트 개원성향진단",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "오스템임플란트 개원성향진단",

    description:
      "12문항으로 나의 개원 성향을 확인하고 맞춤형 개원 전략과 상담을 받아보세요.",

    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
