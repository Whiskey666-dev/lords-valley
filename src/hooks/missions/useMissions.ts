import { useState, useMemo, useCallback, useEffect } from "react";
import {
  type MissionCategoryId,
  type MissionData,
  CATEGORY_ORDER,
  MISSION_CATEGORIES,
  getInitialMissionsWithProgress,
  getCategoryProgress,
  getGlobalProgress,
} from "./missionsData";

const STORAGE_KEY = "lordsvalley_missions_v1";

function loadMissions(): MissionData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MissionData[];
      // Validate length matches expected (6*20=120)
      if (Array.isArray(parsed) && parsed.length === 120) return parsed;
    }
  } catch {}
  return getInitialMissionsWithProgress();
}

function saveMissions(missions: MissionData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch {}
}

export function useMissions() {
  const [missions, setMissions] = useState<MissionData[]>(() => loadMissions());
  const [selectedCategory, setSelectedCategory] = useState<MissionCategoryId>("supervivencia");
  const [selectedMissionId, setSelectedMissionId] = useState<string>(() => {
    const initial = loadMissions();
    const firstAvailable = initial.find(m => m.status !== "locked");
    return firstAvailable?.id ?? initial[0].id;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "completed" | "locked">("all");

  // Persist
  useEffect(() => {
    saveMissions(missions);
  }, [missions]);

  // Keyboard ESC to close is handled by panel itself, but we also support J via parent

  const selectedMission = useMemo(() => {
    return missions.find(m => m.id === selectedMissionId) ?? missions.find(m => m.categoryId === selectedCategory) ?? missions[0];
  }, [missions, selectedMissionId, selectedCategory]);

  const filteredMissions = useMemo(() => {
    let list = missions.filter(m => m.categoryId === selectedCategory);
    if (filterStatus !== "all") {
      if (filterStatus === "available") list = list.filter(m => m.status === "available" || m.status === "active");
      else list = list.filter(m => m.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [missions, selectedCategory, filterStatus, searchQuery]);

  const categoryProgress = useMemo(() => {
    const map: Record<string, ReturnType<typeof getCategoryProgress>> = {};
    for (const cat of CATEGORY_ORDER) {
      map[cat] = getCategoryProgress(missions, cat);
    }
    return map;
  }, [missions]);

  const globalProgress = useMemo(() => getGlobalProgress(missions), [missions]);

  const canAccessCategory = useCallback((catId: MissionCategoryId): boolean => {
    const idx = CATEGORY_ORDER.indexOf(catId);
    if (idx === 0) return true;
    const prevCat = CATEGORY_ORDER[idx - 1];
    const prevProgress = getCategoryProgress(missions, prevCat);
    // Allow access if previous category has at least 1 completed, but gate progression for rewards
    // For UX, allow browsing but missions locked
    return prevProgress.completed > 0;
  }, [missions]);

  const isCategoryUnlocked = useCallback((catId: MissionCategoryId): boolean => {
    const idx = CATEGORY_ORDER.indexOf(catId);
    if (idx === 0) return true;
    const prevCat = CATEGORY_ORDER[idx - 1];
    const prevProgress = getCategoryProgress(missions, prevCat);
    return prevProgress.percent >= 50 || prevProgress.completed >= 10;
  }, [missions]);

  // Start mission (available -> active)
  const startMission = useCallback((missionId: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id !== missionId) return m;
      if (m.status !== "available") return m;
      return { ...m, status: "active" as const };
    }));
  }, []);

  // Complete mission (active/available -> completed) and unlock next
  const completeMission = useCallback((missionId: string) => {
    setMissions(prev => {
      const idx = prev.findIndex(m => m.id === missionId);
      if (idx === -1) return prev;
      const mission = prev[idx];
      if (mission.status === "locked" || mission.status === "completed") return prev;

      const updated = [...prev];
      updated[idx] = { ...mission, status: "completed" as const, objectives: mission.objectives.map(o => ({ ...o, done: true })) };

      // Unlock next mission in same category or next category first mission
      const nextIdx = idx + 1;
      if (nextIdx < updated.length) {
        const next = updated[nextIdx];
        if (next.status === "locked") {
          // Only unlock if sequential: either same category next index, or next category if previous cat >= 50%
          const curCatIdx = CATEGORY_ORDER.indexOf(mission.categoryId);
          const nextCatIdx = CATEGORY_ORDER.indexOf(next.categoryId);
          if (next.categoryId === mission.categoryId) {
            updated[nextIdx] = { ...next, status: "available" as const };
          } else if (nextCatIdx === curCatIdx + 1) {
            // Gate next category: require at least 15 completed in current cat to unlock first of next
            const completedInCat = updated.filter(m => m.categoryId === mission.categoryId && m.status === "completed").length;
            if (completedInCat >= 15) {
              updated[nextIdx] = { ...next, status: "available" as const };
            }
            // else remain locked until threshold met (but we also auto-unlock when threshold reached via effect)
          }
        }
      }

      // Also check if any later locked missions in same category should be unlocked due to earlier completion (sequential gap fill)
      // Find first locked in each category after a completed chain
      for (let i = 0; i < updated.length - 1; i++) {
        if (updated[i].status === "completed" && updated[i + 1].status === "locked") {
          // If categories differ, check threshold
          if (updated[i].categoryId !== updated[i + 1].categoryId) {
            const catCompleted = updated.filter(m => m.categoryId === updated[i].categoryId && m.status === "completed").length;
            if (catCompleted >= 15) {
              updated[i + 1] = { ...updated[i + 1], status: "available" };
            }
          } else {
            updated[i + 1] = { ...updated[i + 1], status: "available" };
          }
          break; // only first gap
        }
      }

      return updated;
    });
  }, []);

  // Reset progress (dev)
  const resetProgress = useCallback(() => {
    const fresh = getInitialMissionsWithProgress();
    setMissions(fresh);
    setSelectedCategory("supervivencia");
    setSelectedMissionId(fresh[0].id);
    saveMissions(fresh);
  }, []);

  // When category changes, auto-select first visible mission
  useEffect(() => {
    const list = missions.filter(m => m.categoryId === selectedCategory);
    const preferred = list.find(m => m.status === "active") ?? list.find(m => m.status === "available") ?? list.find(m => m.status !== "locked") ?? list[0];
    if (preferred && preferred.id !== selectedMissionId) {
      // Only auto-switch if current selection not in this category
      const currentInCat = missions.find(m => m.id === selectedMissionId)?.categoryId === selectedCategory;
      if (!currentInCat) setSelectedMissionId(preferred.id);
    }
  }, [selectedCategory, missions, selectedMissionId]);

  // Helper to get next unlock hint
  const nextUnlockHint = useMemo(() => {
    const currentCat = MISSION_CATEGORIES[selectedCategory];
    const progress = categoryProgress[selectedCategory];
    const idx = CATEGORY_ORDER.indexOf(selectedCategory);
    if (idx < CATEGORY_ORDER.length - 1) {
      const nextCat = MISSION_CATEGORIES[CATEGORY_ORDER[idx + 1]];
      if (progress.completed < 15) {
        return `Completa ${15 - progress.completed} misiones más de ${currentCat.label} para desbloquear ${nextCat.label}`;
      }
    }
    if (progress.completed < progress.total) {
      return `Progreso: ${progress.completed}/${progress.total} — Siguiente misión disponible`;
    }
    return "¡Capítulo completado! Has dominado esta etapa.";
  }, [selectedCategory, categoryProgress]);

  return {
    missions,
    filteredMissions,
    selectedCategory,
    setSelectedCategory,
    selectedMission,
    selectedMissionId,
    setSelectedMissionId,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    categoryProgress,
    globalProgress,
    canAccessCategory,
    isCategoryUnlocked,
    startMission,
    completeMission,
    resetProgress,
    nextUnlockHint,
    categories: MISSION_CATEGORIES,
    categoryOrder: CATEGORY_ORDER,
  };
}

export default useMissions;
