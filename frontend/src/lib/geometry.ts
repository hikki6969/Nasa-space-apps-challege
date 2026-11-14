export interface Point2D {
  x: number
  y: number
}

function cross(origin: Point2D, a: Point2D, b: Point2D): number {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)
}

/**
 * Monotone-chain convex hull. Used only to enclose observed points; it is not
 * a fitted model, probability region, or validated flammability boundary.
 */
export function convexHull(points: Point2D[]): Point2D[] {
  const unique = [
    ...new Map(
      points.map((point) => [`${point.x}:${point.y}`, point] as const),
    ).values(),
  ].sort((left, right) => left.x - right.x || left.y - right.y)

  if (unique.length <= 2) return unique

  const lower: Point2D[] = []
  for (const point of unique) {
    while (lower.length >= 2) {
      const a = lower[lower.length - 2]
      const b = lower[lower.length - 1]
      if (!a || !b || cross(a, b, point) > 0) break
      lower.pop()
    }
    lower.push(point)
  }

  const upper: Point2D[] = []
  for (let index = unique.length - 1; index >= 0; index -= 1) {
    const point = unique[index]
    if (!point) continue
    while (upper.length >= 2) {
      const a = upper[upper.length - 2]
      const b = upper[upper.length - 1]
      if (!a || !b || cross(a, b, point) > 0) break
      upper.pop()
    }
    upper.push(point)
  }

  lower.pop()
  upper.pop()
  return [...lower, ...upper]
}
