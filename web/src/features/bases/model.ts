import type { BaseStatus } from './schema'

export const STATUS_INFO: Record<BaseStatus, { label: string; explain: string; order: number }> = {
  oficial: { label: 'oficial', explain: 'Fonte oficial, reconciliada com totais publicados.', order: 0 },
  preliminar: { label: 'preliminar', explain: 'Dado oficial ainda sujeito a mudança até a totalização.', order: 1 },
  derivado: { label: 'derivado', explain: 'Calculado por nós a partir de fontes oficiais; vale o que valem a fonte e o método.', order: 2 },
  parcial: { label: 'parcial', explain: 'Parte conferida em fonte, parte ainda a confirmar.', order: 3 },
  julgamento: { label: 'julgamento', explain: 'Parâmetros e efeitos são premissas editáveis, não estimativas medidas.', order: 4 },
  'nao-verificado': { label: 'não verificado', explain: 'Ainda não conferido na fonte.', order: 5 },
  'em-preparacao': { label: 'em preparação', explain: 'Ainda não gerado.', order: 6 },
}

export type PageKey = 'home' | 'mapa' | 'municipio' | 'decisoes' | 'historia' | 'antes' | 'gente' | 'clima' | 'potenciais' | 'pilares' | 'marx' | 'violencia' | 'forense' | 'corrupcao' | 'pessimismo' | 'quebras' | 'futuro' | 'propostas' | 'metodo' | 'referencias' | 'biblioteca' | 'eleicoes' | 'classes' | 'indigenas' | 'voto'

export function pageKeyFromPath(pathname: string): PageKey {
  const seg = pathname.split('/').filter(Boolean)[0] ?? ''
  switch (seg) {
    case '':
      return 'home'
    case 'mapa':
      return 'mapa'
    case 'municipio':
      return 'municipio'
    case 'antes-de-1500':
      return 'antes'
    case 'indigenas-eleicoes':
      return 'indigenas'
    case 'voto-analfabeto':
      return 'voto'
    case 'biblioteca':
    case 'eleicoes':
    case 'classes':
      return seg
    case 'decisoes':
    case 'historia':
    case 'clima':
    case 'potenciais':
    case 'pilares':
    case 'marx':
    case 'violencia':
    case 'gente':
    case 'forense':
    case 'corrupcao':
    case 'pessimismo':
    case 'quebras':
    case 'futuro':
    case 'propostas':
    case 'metodo':
    case 'referencias':
      return seg
    default:
      return 'home'
  }
}

/** Áreas de proposta relevantes por página. */
export const PROPOSAL_AREAS: Record<PageKey, string[]> = {
  home: [],
  mapa: ['antifraude', 'dados'],
  municipio: ['antifraude'],
  decisoes: ['macro'],
  historia: ['dados'],
  antes: ['dados'],
  clima: ['macro', 'dados'],
  potenciais: ['macro'],
  pilares: ['macro', 'dados'],
  marx: ['macro', 'dados'],
  violencia: ['dados', 'antifraude'],
  gente: ['dados', 'macro'],
  forense: ['antifraude'],
  corrupcao: ['antifraude', 'dinheiro-publico', 'dados'],
  pessimismo: ['macro', 'dados'],
  quebras: ['macro', 'dados'],
  futuro: ['macro'],
  propostas: [],
  metodo: [],
  referencias: [],
  biblioteca: ['dados'],
  eleicoes: ['antifraude', 'dados'],
  classes: ['dados', 'macro'],
  indigenas: ['dados'],
  voto: ['dados', 'antifraude'],
}
export const AREA_LABEL: Record<string, string> = {
  antifraude: 'Antifraude',
  macro: 'Macro e decisões',
  dados: 'Dados e fontes',
  'dinheiro-publico': 'Dinheiro público',
}
