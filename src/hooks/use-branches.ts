import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Branch {
  id: number;
  name: string;
  name_en: string;
  address: string;
  city: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  is_active: boolean;
  display_order: number;
  opening_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  } | null;
  created_at: string;
  updated_at: string;
}

export interface BranchStatus {
  branch: Branch;
  isOpen: boolean;
  nextTime: string;
  currentDay: string;
}

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Branch[];
    },
  });
}

export function useBranchById(branchId: number | null) {
  return useQuery({
    queryKey: ["branch", branchId],
    queryFn: async () => {
      if (!branchId) return null;
      
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", branchId)
        .single();

      if (error) throw error;
      return data as Branch;
    },
    enabled: !!branchId,
  });
}

export function useBranchStatus(branch: Branch | null): BranchStatus | null {
  if (!branch || !branch.opening_hours) return null;

  const now = new Date();
  const helsinkiTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Helsinki" }));
  const currentDay = helsinkiTime.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const currentTime = helsinkiTime.toTimeString().slice(0, 5); // HH:MM format

  const daySchedule = branch.opening_hours[currentDay as keyof typeof branch.opening_hours];
  
  if (!daySchedule || daySchedule.closed) {
    return {
      branch,
      isOpen: false,
      nextTime: "Closed today",
      currentDay,
    };
  }

  const isOpen = currentTime >= daySchedule.open && currentTime <= daySchedule.close;
  const nextTime = isOpen ? daySchedule.close : daySchedule.open;

  return {
    branch,
    isOpen,
    nextTime,
    currentDay,
  };
}

export function useBranchesWithStatus() {
  const { data: branches, ...rest } = useBranches();
  
  const branchesWithStatus = branches?.map(branch => {
    const status = useBranchStatus(branch);
    return status;
  }).filter(Boolean) as BranchStatus[];

  return {
    data: branchesWithStatus,
    ...rest,
  };
}

// Helper to find branch by city
export function findBranchByCity(branches: Branch[] | undefined, city: string): Branch | null {
  if (!branches || !city) return null;
  
  const normalizedCity = city.toLowerCase().trim();
  const found = branches.find(b => b.city.toLowerCase().trim() === normalizedCity);
  
  // If not found, return first active branch (default)
  return found || branches[0] || null;
}
