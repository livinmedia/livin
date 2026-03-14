export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is handled client-side by individual dashboard pages
  return <>{children}</>;
}
