import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Image from "next/image";
import { Button } from "@nextui-org/button";
import "@polkadot/api-augment";
import { Providers } from "./providers";
import { unbounded } from "./fonts"; // Import the unbounded font
import Link from "next/link";
import { XIcon } from "./ui/icons";
import Script from "next/script";
import { ConnectButton } from "./ui/connect-button";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Polkadot Hungary egyszerű stake/nominálás",
  description: "Stake-eld DOT tokened a Polkadot Hungary-vel",
  metadataBase: new URL("https://polkadothungary.net"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={unbounded.className}> {/* Use the unbounded className */}
        <Providers>
          <div className="relative flex flex-col min-h-[100vh]">
            <header className="h-24">
              <nav className="flex fixed w-full top-0 h-24 p-4 justify-between">
                <div className="relative w-[276px] h-[93.75px]"> 
                  <Image
                    src="/polkadotHU.png"
                    alt="Polkadot Hungary logo"
                    layout="fill"
                    objectFit="contain" 
                  />
                </div>
                <ConnectButton />
              </nav>
            </header>
            <main className="flex max-w-7xl mx-auto p-4 flex-grow w-full">
              {children}
            </main>
            <footer className="fixed bottom-0 flex max-w-7xl mx-auto h-16 p-4 w-full text-xs items-center gap-2">
              <Link href="https://polkadothungary.net">
                <Button variant="bordered"
                        className={"border-2 border-white text-white shadow-xl text-base py-6 rounded-xl hover:bg-white/10"}
                        size="sm">
                  Blog
                </Button>
              </Link>
              <Link
                href="https://twitter.com/polkadothungary"
                target="_blank"
                className="pl-2"
              >
                <XIcon size={22} />
              </Link>
            </footer>
          </div>
          <Toaster
            position="bottom-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{ }}
            toastOptions={{
              className: "",
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 4000,
                iconTheme: {
                  primary: "green",
                  secondary: "white",
                },
              },
            }}
          />
        </Providers>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-FNKNFVZVCN" />
        <Script id="google-analytics">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-FNKNFVZVCN');
        `}
        </Script>
      </body>
    </html>
  );
}
