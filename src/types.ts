export interface Position {
  x: number
  y: number
}

export interface BoardElement {
  id: string,
  class: string,
  text: string,
  description: string
  recept?: [string, string][]
  position: Position
}
