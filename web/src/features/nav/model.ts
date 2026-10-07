import type { IconName } from '@/components/atoms/Icon'

export type NavItem = { to: string; label: string; icon: IconName; desc: string }
export type NavGroup = { key: string; label: string; items: NavItem[] }

export const NAV_HOME: NavItem = { to: '/', label: 'Visão geral', icon: 'home', desc: 'O que está nos dados, de relance' }

/** Navegação agrupada por pergunta que o usuário faz, não por tipo de arquivo. */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'dados',
    label: 'Dados e mapa',
    items: [
      { to: '/mapa', label: 'Mapa', icon: 'map', desc: '5.570 municípios, 3 pleitos, território, violência e risco no RS' },
      { to: '/forense', label: 'Forense eleitoral', icon: 'shield', desc: 'Triagem estatística, com os limites à vista' },
      { to: '/corrupcao', label: 'Custo da corrupção', icon: 'coins', desc: 'R$ por área e quem se beneficia, sem nomes' },
    ],
  },
  {
    key: 'modelos',
    label: 'Modelos e decisões',
    items: [
      { to: '/decisoes', label: 'Decisões', icon: 'scale', desc: 'Viabilidade × impacto de cada decisão, em R$' },
      { to: '/quebras', label: 'Quebras estruturais', icon: 'activity', desc: 'Onde as séries mudam de regime, e o que o detector enxerga' },
      { to: '/futuro', label: 'Futuro: leis e projeções', icon: 'compass', desc: 'Moore, Wright, difusão, e onde o modelo perde' },
    ],
  },
  {
    key: 'passado',
    label: 'Passado e pensamento',
    items: [
      { to: '/historia', label: 'História e evoluções', icon: 'history', desc: 'Instituições, cadeias de Markov e anéis de realimentação' },
      { to: '/antes-de-1500', label: 'Antes de 1500', icon: 'hourglass', desc: 'Povos, clima e manejo do território' },
      { to: '/gente', label: 'Economia & gente', icon: 'users', desc: '14 ciclos, classes e custo humano' },
      { to: '/pilares', label: 'Pilares de pensamento', icon: 'layers', desc: 'Pensamento indígena, afro-brasileiro e outros' },
      { to: '/marx', label: 'Marx e o capitalismo', icon: 'quote', desc: 'O texto original, a tese do “não implementável” e os mal-entendidos' },
      { to: '/violencia', label: 'Pensadores da violência', icon: 'ripple', desc: '71 pensadores, tipologia, dados e custo, sem justificar violência' },
    ],
  },
  {
    key: 'risco',
    label: 'Futuro e risco',
    items: [
      { to: '/clima', label: 'Clima e economia', icon: 'leaf', desc: 'El Niño, séries, cenários e valor financeiro' },
      { to: '/potenciais', label: 'Potências do Brasil', icon: 'gem', desc: 'O que o país tem e quase ninguém nota' },
      { to: '/pessimismo', label: 'Visões pessimistas', icon: 'trendDown', desc: 'Estresse, decisões ruins e capacidade estatal' },
    ],
  },
  {
    key: 'metodo',
    label: 'Método e fontes',
    items: [
      { to: '/metodo', label: 'Método & fontes', icon: 'chart', desc: 'Proveniência, validações e limites' },
      { to: '/referencias', label: 'Referências', icon: 'book', desc: '127 referências por área, com selo' },
      { to: '/propostas', label: 'Propostas', icon: 'bulb', desc: 'Próximos passos, o que precisam e o risco' },
    ],
  },
]

export const ALL_NAV: NavItem[] = [NAV_HOME, ...NAV_GROUPS.flatMap((g) => g.items)]

/** Rotas que pertencem a um item mesmo sem ser o caminho exato (ex.: /municipio/:ibge → Mapa). */
const ALIAS: Record<string, string> = { '/municipio': '/mapa' }

export function groupKeyOf(pathname: string): string | null {
  const seg = `/${pathname.split('/').filter(Boolean)[0] ?? ''}`
  const target = ALIAS[seg] ?? seg
  return NAV_GROUPS.find((g) => g.items.some((i) => i.to === target))?.key ?? null
}
