import { useCallback, useEffect, useRef, useState, MouseEvent } from "react"
import {
  adjustElementCoordinates,
  CanvasContent,
  createElement,
  cursorForPosition,
  DrawingPoint,
  ElementType,
  getElementAtPosition,
  PaintingElement,
  Path,
  resizedCoordinates,
  ToolType,
} from "@/models/PaintingElements"
import { default as rough } from "roughjs"
import Swatch from "./swatch"
import { Color, toColor } from "react-color-palette"

type CanvasAction =
  | "none"
  | "drawing"
  | "sketching"
  | "moving"
  | "resize"
  | "erasing"

export type CanvasProps = {
  readonly content?: CanvasContent
  readonly onSave: (content: CanvasContent, thumbnail?: string) => void
}

export default function Canvas({ content, onSave }: CanvasProps) {
  const [elements, setElements] = useState<readonly PaintingElement[]>(
    content?.elements ?? []
  )
  const [isDrawing, setIsDrawing] = useState(false)

  const [points, setPoints] = useState<DrawingPoint[]>([])
  const [path, setPath] = useState<Path | null>(content?.path ?? null)
  const [selectedElement, setSelectedElement] = useState<
    | (PaintingElement & {
        position?: string | null
        offsetX?: number
        offsetY?: number
      })
    | null
  >(null)

  const [color, setColor] = useState<Color>({
    hex: "#000000",
    hsv: { h: 0, s: 0, v: 0 },
    rgb: { r: 0, g: 0, b: 0 },
  })
  const [width, setWidth] = useState(1)
  const [shapeWidth, setShapeWidth] = useState(1)
  const [action, setAction] = useState<CanvasAction>("none")
  const [toolType, setToolType] = useState<ToolType>("pencil")
  const [popped, setPopped] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>()

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.save()

    const drawPath = (path: Path) => {
      for (const stroke of path) {
        ctx.beginPath()

        for (const point of stroke) {
          ctx.strokeStyle = point.color?.hex ?? "#000000"
          ctx.lineWidth = point.lineWidth ?? 1

          ctx.quadraticCurveTo(point.x, point.y, NaN, NaN)
          ctx.lineTo(point.x, point.y)
          ctx.stroke()
        }
        ctx.closePath()
        ctx.save()
      }
    }

    if (toolType === "eraser" && popped === true) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      setPopped(false)
    }

    const roughCanvas = rough.canvas(canvasRef.current)

    if (path && path.length > 0) drawPath(path)

    for (const { roughElement } of elements) {
      if (!roughElement) continue
      ctx.globalAlpha = 1
      ctx.strokeStyle = roughElement.options.stroke
      roughCanvas.draw(roughElement)
    }

    return () => {
      ctx.clearRect(
        0,
        0,
        canvasRef.current?.width ?? 0,
        canvasRef.current?.height ?? 0
      )
    }
  }, [elements, path, popped, toolType])

  const updateElement = useCallback(
    (
      index: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      type: ElementType,
      width?: number,
      color?: Color
    ) => {
      const updatedElement = createElement({
        id: index,
        x1,
        y1,
        x2,
        y2,
        type,
        width,
        strokeColor: color?.hex ?? "#000000",
      })
      const elementsCopy = [...elements]
      elementsCopy[index] = updatedElement
      setElements(elementsCopy)
    },
    [elements]
  )

  const checkPresent = useCallback(
    (clientX: number, clientY: number) => {
      if (!path) return

      var newPath = [...path]
      path.forEach((stroke, index) => {
        stroke.forEach((point, i) => {
          if (
            clientY < point.y + 10 &&
            clientY > point.y - 10 &&
            clientX < point.x + 10 &&
            clientX > point.x - 10
          ) {
            newPath.splice(index, 1)
            setPopped(true)
            setPath(newPath)
            return
          }
        })
      })
      const newElements = [...elements]
      newElements.forEach((el, index) => {
        if (
          clientX >= el.x1 &&
          clientX <= el.x2 &&
          clientY >= el.y1 &&
          clientY <= el.y2
        ) {
          console.log("Popped....")
          newElements.splice(index, 1)
          setPopped(true)
          setElements(newElements)
        }
      })
    },
    [path, elements]
  )

  const handleMouseDown = useCallback(
    (evt: MouseEvent) => {
      if (!canvasRef.current) return

      const { clientX, clientY } = evt
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      switch (toolType) {
        case "selection":
          const element = getElementAtPosition(clientX, clientY, elements)
          if (element) {
            const offsetX = clientX - element.x1
            const offsetY = clientY - element.y1
            setSelectedElement({ ...element, offsetX, offsetY })
            if (element.position === "inside") {
              setAction("moving")
            } else {
              setAction("resize")
            }
          }
          break

        case "eraser":
          setAction("erasing")
          checkPresent(clientX, clientY)
          break

        case "pencil":
        case "brush":
          setAction("sketching")
          setIsDrawing(true)

          const newColor = color.hex
          const newLineWidth = width
          const transparency = toolType === "brush" ? 0.1 : 1
          const newPoint: DrawingPoint = {
            x: clientX,
            y: clientY,
            color,
            lineWidth: width,
            transparency,
          }
          setPoints((state) => [...state, newPoint])

          ctx.strokeStyle = newColor
          ctx.lineWidth = newLineWidth
          ctx.lineCap = "round"
          ctx.moveTo(clientX, clientY)
          ctx.beginPath()
          break

        default: {
          const id = elements.length
          setAction("drawing")
          const newColor = color.hex
          const newWidth = shapeWidth
          const element = createElement({
            id,
            x1: clientX,
            y1: clientY,
            x2: clientX,
            y2: clientY,
            type: "default",
            width: newWidth,
            strokeColor: newColor,
          })

          setElements((prevState) => [...prevState, element])
          setSelectedElement(element)
        }
      }
    },
    [elements, toolType, color, shapeWidth, width, checkPresent, setAction]
  )

  const handleMouseMove = useCallback(
    (evt: MouseEvent) => {
      if (!canvasRef.current) return

      const { clientX, clientY } = evt
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      if (toolType === "selection") {
        const element = getElementAtPosition(clientX, clientY, elements)
        ;(evt.target as HTMLCanvasElement).style.cursor = element
          ? cursorForPosition(element.position ?? "")
          : "default"
      }

      switch (action) {
        case "erasing":
          checkPresent(clientX, clientY)
          break

        case "sketching":
          {
            if (!isDrawing) return
            const color = points[points.length - 1].color
            const lineWidth = points[points.length - 1].lineWidth
            const transparency = points[points.length - 1].transparency
            const newPoint: DrawingPoint = {
              x: clientX,
              y: clientY,
              color,
              lineWidth,
              transparency,
            }

            setPoints((state) => [...state, newPoint])
            ctx.quadraticCurveTo(clientX, clientY, NaN, NaN)
            ctx.lineTo(clientX, clientY)
            ctx.stroke()
          }
          break

        case "drawing":
          {
            const index = elements.length - 1
            const { x1, y1 } = elements[index]
            elements[index].strokeColor = color?.hex ?? "#000000"
            elements[index].width = shapeWidth
            updateElement(
              index,
              x1,
              y1,
              clientX,
              clientY,
              toolType as ElementType,
              shapeWidth,
              color
            )
          }
          break

        case "moving":
          if (selectedElement) {
            const {
              id,
              x1,
              x2,
              y1,
              y2,
              type,
              offsetX,
              offsetY,
              width,
              strokeColor,
            } = selectedElement
            const offsetWidth = x2 - x1
            const offsetHeight = y2 - y1
            const newX = clientX - (offsetX ?? 0)
            const newY = clientY - (offsetY ?? 0)
            updateElement(
              id,
              newX,
              newY,
              newX + offsetWidth,
              newY + offsetHeight,
              type,
              width,
              toColor("hex", strokeColor ?? "#000000")
            )
          }
          break

        case "resize":
          {
            if (selectedElement) {
              const { id, type, position, ...coordinates } = selectedElement
              const coord = resizedCoordinates(
                clientX,
                clientY,
                position ?? "default",
                coordinates
              )
              const { x1, y1, x2, y2 } = coord ?? { x1: 0, y1: 1, x2: 0, y2: 0 }
              updateElement(id, x1, y1, x2, y2, type, shapeWidth, color)
            }
          }
          break
      }
    },
    [
      action,
      isDrawing,
      elements,
      points,
      selectedElement,
      shapeWidth,
      toolType,
      color,
      checkPresent,
      updateElement,
    ]
  )

  const handleMouseUp = useCallback(() => {
    switch (action) {
      case "resize":
        if (selectedElement) {
          const index = selectedElement.id
          const { id, type, width, strokeColor } = elements[index]
          const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index])
          updateElement(
            id,
            x1,
            y1,
            x2,
            y2,
            type,
            width,
            toColor("hex", strokeColor ?? "#000000")
          )
        }
        break

      case "drawing":
        if (selectedElement) {
          const index = selectedElement.id
          const { id, type, width } = elements[index]
          const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index])
          updateElement(id, x1, y1, x2, y2, type, width, color)
        }
        break

      case "sketching":
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return

        ctx.closePath()
        const element = points
        setPoints([])
        setPath((prevState) => [...(prevState ?? []), element]) //tuple
        setIsDrawing(false)
    }

    setAction("none")
  }, [
    action,
    selectedElement,
    points,
    elements,
    color,
    setAction,
    updateElement,
  ])

  const handleSave = useCallback(async () => {
    let thumbnail: string | undefined = undefined
    if (canvasRef.current) {
      thumbnail = await generateThumbnail(canvasRef.current)
    }
    onSave(
      {
        elements,
        path: path ?? [],
      },
      thumbnail
    )
  }, [elements, path, onSave])

  return (
    <div>
      <Swatch
        toolType={toolType}
        setToolType={setToolType}
        width={width}
        setWidth={setWidth}
        setElements={setElements}
        setColor={setColor}
        setPath={setPath}
        color={color}
        setShapeWidth={setShapeWidth}
        onSave={handleSave}
      />
      <canvas
        ref={(ref) => (canvasRef.current = ref)}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          handleMouseDown({
            clientX: touch.clientX,
            clientY: touch.clientY,
          } as MouseEvent)
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0]
          handleMouseMove({
            clientX: touch.clientX,
            clientY: touch.clientY,
          } as MouseEvent)
        }}
        onTouchEnd={handleMouseUp}
      >
        Canvas
      </canvas>
    </div>
  )
}

type DataURLString = `data:${string}`

function readBlobAsDataURL(blob: Blob): Promise<DataURLString> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as DataURLString)
    }
    reader.onerror = (err) => {
      reject(err)
    }
    reader.readAsDataURL(blob)
  })
}

export function generateThumbnail(canvas: HTMLCanvasElement) {
  return new Promise<string | undefined>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        readBlobAsDataURL(blob)
          .then((data) => resolve(data))
          .catch(reject)
      } else {
        reject(new Error("can not generate thumbnail"))
      }
    })
  })
}
