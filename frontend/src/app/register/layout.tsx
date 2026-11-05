import type { Metadata } from "@/platform/metadata";

export const metadata: Metadata = {
  title: "Register | Bharath Delight Foods",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
