import type { GeoCollection } from './schemas'

export const namesFromGeo = (geo: GeoCollection | undefined) =>
  new Map((geo?.features ?? []).map((f) => [f.properties.ibge, { nome: f.properties.nome, uf: f.properties.uf }]))
