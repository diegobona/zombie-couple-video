import Header from "@/components/global-header";
import { SiteFooter } from "@/components/site-footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
} 