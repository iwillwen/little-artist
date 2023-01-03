import React, { useEffect } from "react"
import {
  Color,
  ColorPicker as ColorPickerPalette,
  useColor,
} from "react-color-palette"
import "react-color-palette/lib/css/styles.css"

export type ColorPickerProps = {
  setColor: (color: Color) => void
}

export default function ColorPickerComponent({
  setColor: setOuterColor,
}: ColorPickerProps) {
  const [color, setColor] = useColor("hex", "#121212")
  useEffect(() => {
    setOuterColor(color)
  }, [color, setOuterColor])

  return window.innerWidth < 550 ? (
    <ColorPickerPalette
      width={window.innerWidth * 0.073 * 2.5}
      height={window.innerHeight * 0.1}
      color={color}
      onChange={setColor}
      hideHSV
      hideHEX
      dark
    />
  ) : (
    <ColorPickerPalette
      width={window.innerWidth * 0.073 * 2}
      height={window.innerWidth * 0.073 * 2}
      color={color}
      onChange={setColor}
      hideHSV
      dark
    />
  )
}
