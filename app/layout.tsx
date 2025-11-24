import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tidy Analytics Admin Console",
  description: "Internal data operations and integration management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                  <div className="flex items-center space-x-3">
                    <a href="https://tidyanalytics.com" target="_blank" rel="noopener noreferrer">
                      <img
                        src="https://tidywebassets.blob.core.windows.net/logos/tidyanalytics-high-resolution-logo-transparent.png"
                        alt="Tidy Analytics"
                        className="h-15"
                        style={{ height: '60px' }}
                      />
                    </a>
                    <h1 className="text-xl font-bold text-gray-900">
                      Admin Console
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <a href="/admin/disposition-config" className="text-gray-700 hover:text-gray-900">
                      Disposition Config
                    </a>
                    <a href="/admin/schema-triage-v2" className="text-gray-700 hover:text-gray-900">
                      Schema Triage
                    </a>
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
