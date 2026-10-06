import type { Dimension, Unit } from '../types'

export const UNITS: Array<{ value: Unit; label: string; dimension: Dimension }> = [
  { value: 'piece', label: 'pieza', dimension: 'count' },
  { value: 'g', label: 'g', dimension: 'mass' },
  { value: 'kg', label: 'kg', dimension: 'mass' },
  { value: 'ml', label: 'ml', dimension: 'volume' },
  { value: 'l', label: 'l', dimension: 'volume' },
]

export const DIMENSIONS: Array<{ value: Dimension; label: string }> = [
  { value: 'count', label: 'Unidades' },
  { value: 'mass', label: 'Peso' },
  { value: 'volume', label: 'Volumen' },
]

export function unitsFor(dimension: Dimension): Array<{ value: Unit; label: string }> {
  return UNITS.filter((unit) => unit.dimension === dimension).map(({ value, label }) => ({
    value,
    label,
  }))
}

export function unitLabel(unit: Unit): string {
  return UNITS.find((item) => item.value === unit)?.label ?? unit
}

export function dimensionOf(unit: Unit): Dimension {
  return UNITS.find((item) => item.value === unit)?.dimension ?? 'count'
}
