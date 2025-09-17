import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ecom Store',
  description: 'A minimal e-commerce starter with Next.js, Prisma, and MongoDB',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-neutral-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold">Ecom</Link>
            <nav className="space-x-4 text-sm">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/cart" className="hover:underline">Cart</Link>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 flex-1">{children}</main>
        <footer className="border-t border-neutral-800">
          <div className="container mx-auto px-4 py-8 text-sm text-neutral-400">© {new Date().getFullYear()} Ecom</div>
        </footer>
      </body>
    </html>
  );
}
