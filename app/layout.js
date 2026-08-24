import "./globals.css";

export const metadata = {
  title: "Opening Profile",
  description: "개원성향진단",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
