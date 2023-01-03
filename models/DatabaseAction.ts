import type { ActionMessage } from "./ActionMessage"
import { Artwork } from "./Artwork"

export type ListAction = ActionMessage<"list">
export type ListActionResult = ActionMessage<"list-result", Artwork[]>
export type CreateAction = ActionMessage<
  "create",
  {
    title: string
    createdAt: Date
  }
>
export type SaveAction = ActionMessage<
  "save",
  {
    id: number
    title?: string
    modifiedAt: Date
    data?: Blob
  }
>
export type RemoveAction = ActionMessage<
  "remove",
  {
    id: number
  }
>

export type DatabaseActionMessage =
  | ListAction
  | CreateAction
  | SaveAction
  | RemoveAction
