import * as Comlink from "comlink"
import { WorkerAPI } from "./db.worker"

let api: Comlink.Remote<WorkerAPI>

export function loadDB() {
  if (!api) {
    api = Comlink.wrap<WorkerAPI>(
      new SharedWorker(new URL("./db.worker", import.meta.url), {
        type: "module",
      }).port
    )
  }

  return api
}
