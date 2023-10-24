export interface Position {
  x: number
  y: number
}

export interface AlchemyElement {
  uuid: string
  id: string
  name: string
  ended: boolean
}

export interface AlchemyElementOnBoard extends AlchemyElement {
  description?: string
  position: Position
}
