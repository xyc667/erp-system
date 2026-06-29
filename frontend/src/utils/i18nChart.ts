import type { TFunction } from 'i18next'

export function translateStatusChartData(
  t: TFunction,
  items: { name: string; value: number }[] | undefined,
) {
  return items?.map((s) => ({
    name: t(`status.${s.name}`, { defaultValue: s.name }),
    value: s.value,
  })) ?? []
}
