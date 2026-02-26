// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Carbon Market Arena",
  description: "An autonomous carbon credit trading arena for collaborative agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
