import { CanvasContent } from "./PaintingElements"

export type Artwork = {
  id?: number
  title: string
  createdAt: Date
  modifiedAt: Date
  content?: CanvasContent
  thumbnail?: string
}
