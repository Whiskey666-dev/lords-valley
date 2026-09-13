import { useState, useMemo, useCallback, useEffect } from "react";
import {
  SKILL_DEFS,
  SKILL_CATEGORIES,
  CATEGORY_ORDER,
  getCategoryProgress,
  getGlobalProgress,
  type SkillCategoryId,
  type SkillInfo,
} from "./skillsData";
import {
  apiMessage,
  fetchMySkills,
  trainMySkills,
  type SkillsStateDto,
} from "../../app/api/player.api";
import { setInventoryCache } from "../inventory/playerInventoryStore";

function mergeSkills(remote: SkillsStateDto | null): Record<SkillCategoryId, SkillInfo[]> {
  const out = {} as Record<SkillCategoryId, SkillInfo[]>;
  for (const cat of CATEGORY_ORDER) {
    const states = remote?.[cat];
    out[cat] = SKILL_DEFS[cat].map((def) => {
      const s = states?.find((x) => x.id === def.id);
      return {
        ...def,
        level: s?.level ?? 0,
        xp: s?.xp ?? 0,
        maxXp: 100,
        tier: s?.tier ?? 1,
        unlocked: s?.unlocked ?? true,
      };
    });
  }
  return out;
}

export function useSkills() {
  const [remote, setRemote] = useState<SkillsStateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategoryId | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRemote(await fetchMySkills());
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMySkills().then(
      (data) => {
        if (cancelled) return;
        setRemote(data);
        setError(null);
        setLoading(false);
      },
      (e) => {
        if (cancelled) return;
        setError(apiMessage(e));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const skillsByCat = useMemo(() => mergeSkills(remote), [remote]);

  const categoryProgress = useMemo(() => {
    const map: Record<string, ReturnType<typeof getCategoryProgress>> = {};
    for (const cat of CATEGORY_ORDER) {
      map[cat] = getCategoryProgress(skillsByCat[cat]);
    }
    return map as Record<SkillCategoryId, ReturnType<typeof getCategoryProgress>>;
  }, [skillsByCat]);

  const globalProgress = useMemo(() => getGlobalProgress(skillsByCat), [skillsByCat]);

  const trainSchool = useCallback(async (catId: SkillCategoryId): Promise<string | null> => {
    try {
      const res = await trainMySkills({ escuela: catId });
      setRemote(res.skills);
      setInventoryCache(res.inventory);
      return null;
    } catch (e) {
      return apiMessage(e);
    }
  }, []);

  const trainSkill = useCallback(
    async (catId: SkillCategoryId, skillId: string): Promise<string | null> => {
      try {
        const res = await trainMySkills({ escuela: catId, skillId });
        setRemote(res.skills);
        setInventoryCache(res.inventory);
        return null;
      } catch (e) {
        return apiMessage(e);
      }
    },
    [],
  );

  const selectedCategoryInfo = selectedCategory ? SKILL_CATEGORIES[selectedCategory] : null;
  const selectedSkills = selectedCategory ? skillsByCat[selectedCategory] : null;

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
    trainSchool,
    trainSkill,
    loading,
    error,
    refresh,
  };
}

export default useSkills;
