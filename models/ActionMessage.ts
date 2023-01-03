export type ActionMessage<S extends string, P = unknown> = {
  action: S
  payload?: P
}
