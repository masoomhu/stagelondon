import './globals.css';

export const metadata = {
  title: 'STAGE LONDON \u2014 Live Performance Guide',
  description: "Discover what's playing across London's West End, Off-West End, and Fringe stages.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
