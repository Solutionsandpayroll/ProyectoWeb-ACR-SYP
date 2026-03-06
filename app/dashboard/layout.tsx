import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100 overflow-x-hidden">
      <div className="no-print">
        <Sidebar />
      </div>
      {/* Main content — offset by sidebar width */}
      <div className="flex-1 min-w-0 ml-72 print:ml-0 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
