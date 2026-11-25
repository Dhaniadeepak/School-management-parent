import { useEffect } from 'react';
import { useChildrenQuery } from '../api/parentApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { childSelected } from '../features/child/childSlice';
import type { Child } from '../types';

/** The selected child (falls back to the first one), plus the full list. */
export function useChild(): { child: Child | null; children: Child[]; isLoading: boolean; error: unknown } {
  const { data: children = [], isLoading, error } = useChildrenQuery();
  const selectedId = useAppSelector((s) => s.child.selectedId);
  const dispatch = useAppDispatch();
  const child = children.find((c) => c.id === selectedId) ?? children[0] ?? null;

  useEffect(() => {
    if (child && child.id !== selectedId) dispatch(childSelected(child.id));
  }, [child, selectedId, dispatch]);

  return { child, children, isLoading, error };
}
