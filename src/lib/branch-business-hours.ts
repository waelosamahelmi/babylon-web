/**
 * Branch-Specific Business Hours Management
 * Handles branch-specific opening/closing times and service availability
 */
import { Branch } from "@/hooks/use-branches";

export interface BranchBusinessHours {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  isOpen: boolean;
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time in Finland timezone
 */
function getCurrentFinnishTime(): Date {
  const now = new Date();
  const finnishTime = new Date(now.toLocaleString("sv-SE", { timeZone: "Europe/Helsinki" }));
  return finnishTime;
}

/**
 * Convert branch opening_hours to business hours array
 */
function getBranchBusinessHours(branch: Branch): BranchBusinessHours[] {
  if (!branch.opening_hours) {
    return [];
  }

  const dayMapping = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  return Object.entries(dayMapping).map(([dayKey, dayIndex]) => {
    const dayHours = branch.opening_hours?.[dayKey as keyof typeof branch.opening_hours];

    if (!dayHours) {
      return {
        day: dayIndex,
        openTime: "00:00",
        closeTime: "00:00",
        isOpen: false,
      };
    }

    return {
      day: dayIndex,
      openTime: dayHours.open,
      closeTime: dayHours.close,
      isOpen: !dayHours.closed,
    };
  });
}

/**
 * Check if a specific branch is currently open
 */
export function isBranchOpen(branch: Branch | null, customTime?: Date): boolean {
  if (!branch || !branch.opening_hours || !branch.is_active) {
    return false;
  }

  const now = customTime || getCurrentFinnishTime();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const businessHours = getBranchBusinessHours(branch);

  const todayHours = businessHours.find(h => h.day === currentDay);

  if (!todayHours || !todayHours.isOpen) {
    return false;
  }

  const openMinutes = timeToMinutes(todayHours.openTime);
  const closeMinutes = timeToMinutes(todayHours.closeTime);

  // Handle overnight hours (when close time is next day)
  const isOvernight = closeMinutes < openMinutes;

  if (isOvernight) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  } else {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }
}

/**
 * Get next opening time for a specific branch
 */
export function getBranchNextOpeningTime(
  branch: Branch | null,
  customTime?: Date
): { day: string; dayEn: string; time: string } | null {
  if (!branch || !branch.opening_hours) {
    return null;
  }

  const now = customTime || getCurrentFinnishTime();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const businessHours = getBranchBusinessHours(branch);

  const dayNames = ['Sunnuntai', 'Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai', 'Lauantai'];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Check if branch opens later today
  const todayHours = businessHours.find(h => h.day === currentDay);
  if (todayHours && todayHours.isOpen) {
    const openMinutes = timeToMinutes(todayHours.openTime);
    if (currentMinutes < openMinutes) {
      return {
        day: dayNames[currentDay],
        dayEn: dayNamesEn[currentDay],
        time: todayHours.openTime,
      };
    }
  }

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7;
    const dayHours = businessHours.find(h => h.day === checkDay);

    if (dayHours && dayHours.isOpen) {
      return {
        day: dayNames[checkDay],
        dayEn: dayNamesEn[checkDay],
        time: dayHours.openTime,
      };
    }
  }

  return null;
}

/**
 * Get branch status information
 */
export function getBranchStatus(branch: Branch | null, customTime?: Date) {
  if (!branch) {
    return {
      isOpen: false,
      nextOpening: null,
      branch: null,
    };
  }

  const isOpen = isBranchOpen(branch, customTime);
  const nextOpening = getBranchNextOpeningTime(branch, customTime);

  return {
    isOpen,
    nextOpening,
    branch,
  };
}

/**
 * Check if any branch is currently open
 */
export function isAnyBranchOpen(branches: Branch[], customTime?: Date): boolean {
  return branches.some(branch => isBranchOpen(branch, customTime));
}

/**
 * Get all open branches
 */
export function getOpenBranches(branches: Branch[], customTime?: Date): Branch[] {
  return branches.filter(branch => isBranchOpen(branch, customTime));
}

/**
 * Get the nearest open branch from a list
 * Returns the first open branch or null if none are open
 */
export function getNearestOpenBranch(branches: Branch[], customTime?: Date): Branch | null {
  const openBranches = getOpenBranches(branches, customTime);
  return openBranches.length > 0 ? openBranches[0] : null;
}

/**
 * Format branch hours for display
 */
export function formatBranchHours(branch: Branch, language: 'fi' | 'en' | 'ar' = 'fi'): Array<{ day: string; hours: string }> {
  if (!branch.opening_hours) {
    return [];
  }

  // Define explicit day order (Monday to Sunday)
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  const dayNames: Record<string, { fi: string; en: string; ar: string }> = {
    monday: { fi: "Maanantai", en: "Monday", ar: "الاثنين" },
    tuesday: { fi: "Tiistai", en: "Tuesday", ar: "الثلاثاء" },
    wednesday: { fi: "Keskiviikko", en: "Wednesday", ar: "الأربعاء" },
    thursday: { fi: "Torstai", en: "Thursday", ar: "الخميس" },
    friday: { fi: "Perjantai", en: "Friday", ar: "الجمعة" },
    saturday: { fi: "Lauantai", en: "Saturday", ar: "السبت" },
    sunday: { fi: "Sunnuntai", en: "Sunday", ar: "الأحد" },
  };

  const closedText = language === 'fi' ? 'Suljettu' : language === 'ar' ? 'مغلق' : 'Closed';

  return dayOrder
    .filter(day => branch.opening_hours && branch.opening_hours[day]) // Only include days that exist
    .map((day) => {
      const schedule = branch.opening_hours![day];
      return {
        day: dayNames[day]?.[language] || day,
        hours: schedule.closed ? closedText : `${schedule.open} - ${schedule.close}`,
      };
    });
}

/**
 * Check if ordering is available for a specific branch
 * This checks both if the branch is open AND active
 */
export function isBranchOrderingAvailable(branch: Branch | null, customTime?: Date): boolean {
  if (!branch || !branch.is_active) {
    return false;
  }

  return isBranchOpen(branch, customTime);
}
