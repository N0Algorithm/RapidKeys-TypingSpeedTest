import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans", // Standardize variable name
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono", // Standardize variable name
  subsets: ["latin"],
});

export const metadata = {
  title: "RapidKeys | Fast & Fluid Typing Test",
  description: "Master your keyboard with high-performance typing speed tests and real-time analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
