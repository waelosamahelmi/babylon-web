import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { Clock, MapPin } from "lucide-react";
import { useBranches } from "@/hooks/use-branches";
import { isBranchOpen } from "@/lib/branch-business-hours";

export function MultiBranchStatusHeaderV2() {
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data: branches, isLoading } = useBranches();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Don't render if still loading
  if (isLoading || !branches) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 border-b border-red-100/50 dark:border-stone-700/50 backdrop-blur-sm relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-br from-red-400 to-orange-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 relative">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Branch Status Pills */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {branches.map((branch) => {
              const isOpen = isBranchOpen(branch, currentTime);
              const branchName = language === 'fi' ? branch.name : branch.name_en;

              return (
                <div
                  key={branch.id}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isOpen
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{branchName}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Current Time */}
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>
              {currentTime.toLocaleTimeString('fi-FI', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Helsinki'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
