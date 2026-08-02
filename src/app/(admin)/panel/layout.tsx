import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Panel admina — osobny layout, auth guard przez middleware (Faza 3).
export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
