import { FileText, Loader2 } from "lucide-react";

export default function GenerateLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-sm text-gray-400">Loading Invosmith...</span>
        </div>
      </div>
    </div>
  );
}
