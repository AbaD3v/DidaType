// app/layout.tsx
import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";

// Используем Roboto Mono для максимального сходства с профессиональными тренажерами
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DidaType — профессиональный тест печати",
  description: "Минималистичный и быстрый тренажер слепой печати в стиле Serika Dark.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`
          ${robotoMono.variable} 
          font-mono 
          antialiased 
          bg-[rgb(var(--bg))] 
          text-[rgb(var(--text))] 
          transition-colors 
          duration-300
        `}
        style={{
          // Предотвращаем резкий скачок цвета при загрузке (Flash of unstyled content)
          backgroundColor: "rgb(var(--bg))",
          color: "rgb(var(--text))",
        }}
      >
        {children}
      </body>
    </html>
  );
}