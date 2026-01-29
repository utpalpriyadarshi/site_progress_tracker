/**
 * useTargetDateCalculation Hook
 *
 * Auto-calculates targetDate from project.startDate + targetDays.
 *
 * @version 1.0.0
 * @since Phase 6b - Key Dates Improvements
 */

import { useCallback } from 'react';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface UseTargetDateCalculationParams {
  projectStartDate: number | null;
  dispatch: React.Dispatch<any>;
}

export const useTargetDateCalculation = ({
  projectStartDate,
  dispatch,
}: UseTargetDateCalculationParams) => {
  const handleTargetDaysChange = useCallback(
    (value: string) => {
      dispatch({ type: 'SET_FORM_TARGET_DAYS', payload: value });

      if (!projectStartDate) return;

      const days = parseInt(value, 10);
      if (isNaN(days) || days < 0) {
        dispatch({ type: 'SET_FORM_TARGET_DATE', payload: undefined });
        return;
      }

      const targetDate = new Date(projectStartDate + days * MS_PER_DAY);
      dispatch({ type: 'SET_FORM_TARGET_DATE', payload: targetDate });
    },
    [projectStartDate, dispatch]
  );

  const calculateTargetDate = useCallback(
    (targetDays: number): Date | undefined => {
      if (!projectStartDate || isNaN(targetDays) || targetDays < 0) {
        return undefined;
      }
      return new Date(projectStartDate + targetDays * MS_PER_DAY);
    },
    [projectStartDate]
  );

  return { handleTargetDaysChange, calculateTargetDate };
};
