import { useEffect, useState } from "react"
import {
  Container,
  Text,
  Button,
  Card,
  Grid,
  Row,
  Col,
} from "@nextui-org/react"
import { proxy } from "comlink"
import { loadDB } from "@/db"
import { Artwork } from "@/models/Artwork"

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([])

  useEffect(() => {
    const db = loadDB()
    db.listArtworks().then((data) => setArtworks(data))

    const onSync = proxy((data: Artwork[]) => setArtworks(data))

    db.on("syncArtworks", onSync)

    return () => {
      db.off("syncArtworks", onSync)
    }
  }, [])

  const handleCreateArtwork = async (title = "Untitled Artwork") => {
    const db = loadDB()
    const artwork = await db.createArtwork(title, new Date())
    if (!artwork) return
    handleOpenArtwork(artwork)
  }

  const handleOpenArtwork = (artwork: Artwork) => {
    window.open(`/artwork/${artwork.id}`, "_blank")
  }

  const handleRemoveArtwork = async (artwork: Artwork) => {
    if (!artwork.id) return
    const db = loadDB()
    await db.removeArtwork(artwork.id)
  }

  return (
    <Container css={{ margin: "$20 auto" }}>
      <Text h2>Artworks</Text>
      <Button onPress={() => handleCreateArtwork()}>Create New Artwork</Button>

      <Grid.Container gap={2} justify="flex-start">
        {artworks.map((artwork) => {
          return (
            <Grid xs={3} key={artwork.id}>
              <Card css={{ w: "100%", h: "350px" }}>
                <Card.Body css={{ p: 0 }}>
                  <Card.Image
                    src={artwork.thumbnail ?? ""}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                </Card.Body>
                <Card.Footer
                  isBlurred
                  css={{
                    position: "absolute",
                    bgBlur: "#ffffff66",
                    borderTop:
                      "$borderWeights$light solid rgba(255, 255, 255, 0.2)",
                    bottom: 0,
                    zIndex: 1,
                  }}
                >
                  <Row>
                    <Col>
                      <Text color="#000" h3>
                        {artwork.title}
                      </Text>
                    </Col>
                    <Col>
                      <Row gap={0.5} justify="space-between">
                        <Col>
                          <Button
                            flat
                            auto
                            rounded
                            color="secondary"
                            onPress={() => handleOpenArtwork(artwork)}
                          >
                            <Text
                              css={{ color: "inherit" }}
                              size={12}
                              weight="bold"
                              transform="uppercase"
                            >
                              Open
                            </Text>
                          </Button>
                        </Col>
                        <Col>
                          <Button
                            flat
                            auto
                            rounded
                            color="error"
                            onPress={() => handleRemoveArtwork(artwork)}
                          >
                            <Text
                              css={{ color: "inherit" }}
                              size={12}
                              weight="bold"
                              transform="uppercase"
                            >
                              Delete
                            </Text>
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card.Footer>
              </Card>
            </Grid>
          )
        })}
      </Grid.Container>
    </Container>
  )
}

export async function getStaticProps() {
  return {
    props: {},
  }
}
