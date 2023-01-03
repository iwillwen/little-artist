import { Drawable } from "roughjs/bin/core"
import rough from "roughjs"
import { Color } from "react-color-palette"

export type Point = {
  x: number
  y: number
}

export type DrawingPoint = Point & {
  color?: Color
  lineWidth?: number
  transparency?: number
}
export type Stroke = readonly DrawingPoint[]
export type Path = readonly Stroke[]

export type ElementType =
  | "line"
  | "rectangle"
  | "circle"
  | "triangle"
  | "default"
export type ToolType =
  | ElementType
  | "line"
  | "pencil"
  | "selection"
  | "brush"
  | "fill"
  | "eraser"

export type Position = string
export type Coordinates = {
  x1: number
  y1: number
  x2: number
  y2: number
}
export type PaintingElement = Coordinates & {
  id: number
  roughElement?: Drawable | null
  type: ElementType
  width?: number
  strokeColor?: string
}

export type CanvasContent = {
  readonly elements: readonly PaintingElement[]
  readonly path: Path
}

const generator = rough.generator()

export function createElement({
  id,
  x1,
  y1,
  x2,
  y2,
  type,
  strokeColor,
  width,
}: PaintingElement): PaintingElement {
  let roughElement = null
  switch (type) {
    case "line":
      roughElement = generator.line(x1, y1, x2, y2, {
        stroke: strokeColor,
        strokeWidth: width,
      })
      break
    case "rectangle":
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
        stroke: strokeColor,
        strokeWidth: width,
      })
      break
    case "circle":
      roughElement = generator.circle(
        x1,
        y1,
        2 * Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        {
          stroke: strokeColor,
          strokeWidth: width,
        }
      )
      break
    case "triangle":
      roughElement = generator.linearPath(
        [
          [x1, y1],
          [x2, y2],
          [x1, y2],
          [x1, y1],
        ],
        {
          stroke: strokeColor,
          strokeWidth: width,
        }
      )
      break
    default:
      generator.line(0, 0, 0, 0)
  }

  return {
    id,
    x1,
    y1,
    x2,
    y2,
    type,
    roughElement,
    width,
    strokeColor,
  }
}

export const nearPoint = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  name: string
) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null
}

export const positionWithinElement = (
  x: number,
  y: number,
  element: PaintingElement
) => {
  const { type, x1, x2, y1, y2 } = element
  if (type === "rectangle") {
    const topLeft = nearPoint(x, y, x1, y1, "tl")
    const topRight = nearPoint(x, y, x2, y1, "tr")
    const bottomLeft = nearPoint(x, y, x1, y2, "bl")
    const bottomRight = nearPoint(x, y, x2, y2, "br")
    const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null
    return topLeft || inside || topRight || bottomLeft || bottomRight
  } else {
    const a = { x: x1, y: y1 }
    const b = { x: x2, y: y2 }
    const c = { x, y }
    const offset = distance(a, b) - (distance(a, c) + distance(b, c))
    const start = nearPoint(x, y, x1, y1, "start")
    const end = nearPoint(x, y, x2, y2, "end")
    const inside = Math.abs(offset) < 1 ? "inside" : null
    return start || end || inside
  }
}

export const distance = (a: Point, b: Point) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

export const getElementAtPosition = (
  x: number,
  y: number,
  elements: readonly PaintingElement[]
) => {
  return elements
    .map((el) => ({
      ...el,
      position: positionWithinElement(x, y, el),
    }))
    .find((el) => el.position !== null)
}

export const adjustElementCoordinates = (element: PaintingElement) => {
  const { type, x1, y1, x2, y2 } = element
  if (type === "rectangle") {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)
    return { x1: minX, y1: minY, x2: maxX, y2: maxY }
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 }
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 }
    }
  }
}

export const cursorForPosition = (position: Position) => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize"
    case "tr":
    case "bl":
      return "nesw-resize"
    default:
      return "move"
  }
}

export const resizedCoordinates = (
  clientX: number,
  clientY: number,
  position: Position,
  coordinates: Coordinates
) => {
  const { x1, y1, x2, y2 } = coordinates
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 }
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 }
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY }
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY }
    default:
      return null
  }
}

export const midPointBtw = (p1: Point, p2: Point) => {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2,
  }
}
