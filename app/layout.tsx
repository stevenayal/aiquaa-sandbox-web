import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApiKeyProvider } from "@/lib/auth/ApiKeyContext";
import { CursoProvider } from "@/lib/auth/CursoContext";
import { UsuarioProvider } from "@/lib/auth/UsuarioContext";
import { AuthGuard } from "@/lib/auth/AuthGuard";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aiquaa Sandbox",
  description: "Frontend objetivo para practicar automatización de UI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <CursoProvider>
          <ApiKeyProvider>
            <UsuarioProvider>
              <ToastProvider>
                <AuthGuard>{children}</AuthGuard>
              </ToastProvider>
            </UsuarioProvider>
          </ApiKeyProvider>
        </CursoProvider>
      </body>
    </html>
  );
}
