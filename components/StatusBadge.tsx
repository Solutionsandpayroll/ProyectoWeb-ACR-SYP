import { AcrStatus } from "@/types";

interface StatusBadgeProps {
  status: AcrStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isOpen = status === "Abierta";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isOpen
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isOpen ? "bg-amber-500" : "bg-emerald-500"
        }`}
      />
      {status}
    </span>
  );
}
