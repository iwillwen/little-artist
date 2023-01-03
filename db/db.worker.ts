import * as Comlink from "comlink"
import { openDB, DBSchema } from "idb"
import { Artwork } from "../models/Artwork"
import { EventEmitter } from "events"
import { NotFoundError } from "common-errors"

const eventBus = new EventEmitter()

interface ArtworksDB extends DBSchema {
  artworks: {
    value: Artwork
    key: number
    indexes: { id: number }
  }
}

async function setupDatabase() {
  return await openDB<ArtworksDB>("artworks", 1, {
    upgrade(db) {
      const store = db.createObjectStore("artworks", {
        keyPath: "id",
        autoIncrement: true,
      })
      store.createIndex("id", "id")
    },
  })
}

async function listArtworks() {
  const db = await setupDatabase()
  const artworks = await db.getAllFromIndex("artworks", "id")
  return artworks
}

async function createArtwork(title: string, createdAt: Date = new Date()) {
  const db = await setupDatabase()
  const newRow: Artwork = {
    title,
    createdAt,
    modifiedAt: createdAt,
  }
  const id = await db.add("artworks", newRow)
  const newArtwork = await db.get("artworks", id)
  if (!newArtwork) return null

  eventBus.emit("syncArtworks", await listArtworks())

  return newArtwork
}

async function getArtwork(id: number) {
  const db = await setupDatabase()
  const artwork = await db.get("artworks", id)
  if (!artwork) {
    throw new NotFoundError(`Artwork ${id}`)
  }

  return artwork
}

async function updateArtwork(id: number, patch: Partial<Artwork>) {
  const currentArtwork = await getArtwork(id)

  const db = await setupDatabase()
  const newRow = {
    ...currentArtwork,
    ...patch,
  }
  await db.put("artworks", newRow)
  eventBus.emit("syncArtworks", await listArtworks())

  return getArtwork(id)
}

async function removeArtwork(id: number) {
  const artwork = await getArtwork(id)

  const db = await setupDatabase()
  db.delete("artworks", id)

  eventBus.emit("syncArtworks", await listArtworks())
  return artwork
}

const API = {
  listArtworks,
  createArtwork,
  getArtwork,
  updateArtwork,
  removeArtwork,
  on: async (eventName: string, listener: (...args: any[]) => void) => {
    eventBus.addListener(eventName, listener)
  },
  off: async (eventName: string, listener: (...args: any[]) => void) => {
    eventBus.removeListener(eventName, listener)
  },
}

export type WorkerAPI = typeof API

onconnect = (evt: MessageEvent) => {
  const port = evt.ports[0]

  Comlink.expose(API, port)
}
