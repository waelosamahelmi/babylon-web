import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { Store, MapPin, Clock } from "lucide-react";
import { useBranchesWithStatus } from "@/hooks/use-branches";

export function MultiBranchStatusHeader() {
  const { t, language } = useLanguage();
  const [, setCurrentTime] = useState(new Date());
  const { data: branchesStatus, isLoading } = useBranchesWithStatus();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  if (isLoading || !branchesStatus || branchesStatus.length === 0) {
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {branchesStatus.map((status, index) => (
            <div key={status.branch.id} className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                status.isOpen 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50' 
                  : 'bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/50'
              } transition-all`}>
                <Store className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {language === "en" ? status.branch.name_en : status.branch.name}
                  </span>
                  <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                    status.isOpen 
                      ? 'bg-green-500 animate-pulse shadow-green-500/50' 
                      : 'bg-red-500 shadow-red-500/50'
                  }`}></div>
                </div>
                
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {status.isOpen 
                      ? t(`Sulkeutuu ${status.nextTime}`, `Closes ${status.nextTime}`)
                      : t(`Avautuu ${status.nextTime}`, `Opens ${status.nextTime}`)
                    }
                  </span>
                </div>
              </div>
              
              {/* Divider between branches */}
              {index < branchesStatus.length - 1 && (
                <div className="hidden sm:block h-12 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent ml-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
