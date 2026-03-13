import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { AUTH_COOKIE_NAME, parseSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/login");
  }

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
