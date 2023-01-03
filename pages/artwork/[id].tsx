"use client"

import { useRouter } from "next/router"
import { loadDB } from "@/db"
import { useEffect, useState } from "react"
import { Artwork } from "@/models/Artwork"

import Canvas from "./components/canvas"
import { useCallback } from "react"
import { CanvasContent } from "@/models/PaintingElements"

export default function ArtworkPage() {
  const router = useRouter()
  const { id: idStr } = router.query
  const id = typeof idStr === "string" ? parseInt(idStr) : null

  const [artwork, setArtwork] = useState<Artwork | null>(null)

  const handleSave = useCallback(
    (content: CanvasContent, thumbnail?: string) => {
      if (!artwork || !artwork.id) return

      const db = loadDB()
      db.updateArtwork(artwork.id, {
        content,
        thumbnail,
        modifiedAt: new Date(),
      })
    },
    [artwork]
  )

  useEffect(() => {
    if (!id) return

    const db = loadDB()
    db.getArtwork(id).then((data) => setArtwork(data))
  }, [id])

  if (!id || !artwork) return null

  return (
    <div>
      <Canvas content={artwork.content} onSave={handleSave} />
    </div>
  )
}

export async function getStaticProps() {
  return {
    props: {},
  }
}
