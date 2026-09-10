// src/features/platform-admin/hooks/useTaxonomy.ts

import { useState, useEffect } from 'react';

interface SubInterest {
  name: string;
  icon: string;
}

interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  image?: string;
  subInterests: SubInterest[];
}

export function useTaxonomy() {
  const [categories, setCategories] = useState<InterestCategory[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('taxonomy');
    if (saved) {
      setCategories(JSON.parse(saved));
    }
  }, []);

  const addCategory = (category: Omit<InterestCategory, 'id'>) => {
    const newCategory = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev: InterestCategory[]) => {
      const updated = [...prev, newCategory];
      localStorage.setItem('taxonomy', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCategory = (id: string, updates: Partial<InterestCategory>) => {
    setCategories((prev: InterestCategory[]) => {
      const updated = prev.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      );
      localStorage.setItem('taxonomy', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories((prev: InterestCategory[]) => {
      const updated = prev.filter((cat) => cat.id !== id);
      localStorage.setItem('taxonomy', JSON.stringify(updated));
      return updated;
    });
  };

  const addSubInterest = (categoryId: string, sub: SubInterest) => {
    setCategories((prev: InterestCategory[]) => {
      const updated = prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, subInterests: [...cat.subInterests, sub] }
          : cat
      );
      localStorage.setItem('taxonomy', JSON.stringify(updated));
      return updated;
    });
  };

  const updateSubInterest = (categoryId: string, oldName: string, newSub: SubInterest) => {
    setCategories((prev: InterestCategory[]) => {
      const updated = prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subInterests: cat.subInterests.map((sub) =>
                sub.name === oldName ? newSub : sub
              ),
            }
          : cat
      );
      localStorage.setItem('taxonomy', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSubInterest = (categoryId: string, subName: string) => {
    setCategories((prev: InterestCategory[]) => {
      const updated = prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, subInterests: cat.subInterests.filter((s) => s.name !== subName) }
          : cat
      );
      localStorage.setItem('taxonomy', JSON.stringify(updated));
      return updated;
    });
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubInterest,
    updateSubInterest,
    deleteSubInterest,
  };
}