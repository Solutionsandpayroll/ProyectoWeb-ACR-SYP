"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface DashboardYearSelectProps {
  years: number[];
  selectedYear: number;
}

export default function DashboardYearSelect({ years, selectedYear }: DashboardYearSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleYearChange = (year: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("year", String(year));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="dashboard-year" className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        Año
      </label>
      <select
        id="dashboard-year"
        value={selectedYear}
        onChange={(e) => handleYearChange(Number(e.target.value))}
        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#105789]/30 focus:border-[#105789]"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
