export interface Position {
  x: number
  y: number
}

export interface AlchemyElement {
  uuid: string
  id: string
  name: string
}

export interface AlchemyElementOnBoard extends AlchemyElement {
  description?: string
  position: Position
}
