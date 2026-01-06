export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout overrides the parent layout's header and navigation
  // by returning children without the additional chrome
  return (
    <div className="fixed inset-0 z-50 bg-gray-50">
      {children}
    </div>
  );
}
