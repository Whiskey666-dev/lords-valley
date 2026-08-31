import { useState, useMemo, useCallback, useEffect } from "react";
import {
  INITIAL_SKILLS,
  SKILL_CATEGORIES,
  CATEGORY_ORDER,
  getCategoryProgress,
  getGlobalProgress,
  type SkillCategoryId,
  type SkillInfo,
} from "./skillsData";

const STORAGE_KEY = "lordsvalley_skills_v1";

function cloneSkills(src: Record<SkillCategoryId, SkillInfo[]>): Record<SkillCategoryId, SkillInfo[]> {
  const out = {} as Record<SkillCategoryId, SkillInfo[]>;
  for (const k of Object.keys(src) as SkillCategoryId[]) {
    out[k] = src[k].map(s => ({ ...s }));
  }
  return out;
}

function loadSkills(): Record<SkillCategoryId, SkillInfo[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<SkillCategoryId, SkillInfo[]>;
      // validate has 6 cats and each has skills
      if (parsed && Object.keys(parsed).length === 6) {
        let valid = true;
        for (const cat of CATEGORY_ORDER) {
          if (!Array.isArray(parsed[cat]) || parsed[cat].length === 0) valid = false;
        }
        if (valid) return parsed;
      }
    }
  } catch {}
  return cloneSkills(INITIAL_SKILLS);
}

function saveSkills(data: Record<SkillCategoryId, SkillInfo[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useSkills() {
  const [skillsByCat, setSkillsByCat] = useState<Record<SkillCategoryId, SkillInfo[]>>(() => loadSkills());
  const [selectedCategory, setSelectedCategory] = useState<SkillCategoryId | null>(null);

  useEffect(() => {
    saveSkills(skillsByCat);
  }, [skillsByCat]);

  const categoryProgress = useMemo(() => {
    const map: Record<string, ReturnType<typeof getCategoryProgress>> = {};
    for (const cat of CATEGORY_ORDER) {
      map[cat] = getCategoryProgress(skillsByCat[cat]);
    }
    return map as Record<SkillCategoryId, ReturnType<typeof getCategoryProgress>>;
  }, [skillsByCat]);

  const globalProgress = useMemo(() => getGlobalProgress(skillsByCat), [skillsByCat]);

  const addXp = useCallback((catId: SkillCategoryId, skillId: string, amount = 10) => {
    setSkillsByCat(prev => {
      const next = cloneSkills(prev);
      const list = next[catId];
      const idx = list.findIndex(s => s.id === skillId);
      if (idx === -1) return prev;
      const sk = list[idx];
      let newXp = sk.xp + amount;
      let newLevel = sk.level;
      // level up loop
      while (newXp >= 100 && newLevel < 100) {
        newXp -= 100;
        newLevel = Math.min(100, newLevel + (newLevel < 20 ? 5 : newLevel < 50 ? 3 : newLevel < 80 ? 2 : 1));
      }
      // also auto-unlock tier gating: if level >=20 unlock tier2, >=50 tier3 in same cat
      list[idx] = { ...sk, level: newLevel, xp: Math.min(99, newXp), unlocked: true };
      // unlock next tier skills if thresholds met
      const avg = Math.round(list.reduce((a, s) => a + (s.id === skillId ? newLevel : s.level), 0) / list.length);
      for (const s of list) {
        if (!s.unlocked) {
          if (s.tier === 2 && avg >= 15) s.unlocked = true;
          if (s.tier === 3 && avg >= 35) s.unlocked = true;
        }
      }
      return next;
    });
  }, []);

  const addCategoryXp = useCallback((catId: SkillCategoryId, amount = 5) => {
    // add a bit to all skills in category (simula progreso pasivo)
    setSkillsByCat(prev => {
      const next = cloneSkills(prev);
      const list = next[catId];
      for (let i = 0; i < list.length; i++) {
        const sk = list[i];
        if (!sk.unlocked) continue;
        let newXp = sk.xp + amount + Math.floor(Math.random() * 5);
        let newLevel = sk.level;
        if (newXp >= 100 && newLevel < 100) {
          newXp -= 100;
          newLevel = Math.min(100, newLevel + 1 + Math.floor(Math.random() * 2));
        }
        list[i] = { ...sk, level: newLevel, xp: Math.min(99, newXp) };
      }
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = cloneSkills(INITIAL_SKILLS);
    setSkillsByCat(fresh);
    saveSkills(fresh);
  }, []);

  const selectedCategoryInfo = selectedCategory ? SKILL_CATEGORIES[selectedCategory] : null;
  const selectedSkills = selectedCategory ? skillsByCat[selectedCategory] : null;

  const totalPoints = useMemo(() => {
    // puntos disponibles = suma de (level / 10 floored) simulado
    const total = Object.values(skillsByCat).flat().reduce((a, s) => a + Math.floor(s.level / 10), 0);
    const spent = 0; // placeholder for future spending system
    return { total, available: Math.max(0, total - spent) };
  }, [skillsByCat]);

  return {
    skillsByCat,
    categoryProgress,
    globalProgress,
    categories: SKILL_CATEGORIES,
    categoryOrder: CATEGORY_ORDER,
    selectedCategory,
    setSelectedCategory,
    selectedCategoryInfo,
    selectedSkills,
    addXp,
    addCategoryXp,
    resetProgress,
    totalPoints,
  };
}

export default useSkills;
