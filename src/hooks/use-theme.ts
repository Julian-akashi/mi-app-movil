/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useAppTheme } from '@/contexts/theme-context';
import { Colors } from '@/constants/theme';

export function useTheme() {
  const { colorScheme } = useAppTheme();
  return Colors[colorScheme];
}
