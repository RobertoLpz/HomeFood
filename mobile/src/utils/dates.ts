import type { MealType } from '../types'

export function isoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeek(date = new Date()): string {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = copy.getDay()
  const delta = weekday === 0 ? -6 : 1 - weekday
  copy.setDate(copy.getDate() + delta)
  return isoDate(copy)
}

export function shiftWeek(weekStart: string, weeks: number): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + weeks * 7)
  return isoDate(date)
}

export function weekDays(weekStart: string): string[] {
  const [year, month, day] = weekStart.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return isoDate(date)
  })
}

export function formatDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
  })
}

export const MEAL_TYPES: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Comida' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Snack' },
]

export function mealLabel(type: MealType): string {
  return MEAL_TYPES.find((meal) => meal.value === type)?.label ?? type
}
