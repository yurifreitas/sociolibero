import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { CopyButton } from '@/components/molecules/CopyButton'
import { InlineNote } from '@/components/molecules/InlineNote'
import { Seal } from '@/components/molecules/Seal'
import {
  acharTermo,
  CONF_NIVEL,
  indiceEstrutural,
  localizar,
  splitTexto,
  temaRotulo,
  toBlocos,
  verifyHashes,
  type Bloco,
  type HashCheck,
  type Marca,
} from '@/features/biblioteca/model'
import type { Doc, Trecho } from '@/features/biblioteca/schemas'
import { cn } from '@/lib/cn'
import { fDateTime, shortHash } from '@/lib/format'
import styles from './TextReader.module.css'

type SegProps = { bloco: Bloco; marcas: Marca[]; ativoTrecho: string | null; onTrecho: (id: string) => void }

const BlocoView = memo(function BlocoView({ bloco, marcas, ativoTrecho, onTrecho }: SegProps) {
  if (marcas.length === 0)
    return (
      <p id={`b-${bloco.n}`} className={styles.p}>
        {bloco.texto}
      </p>
    )
  const ms = [...marcas].sort((a, b) => a.ini - b.ini || (a.tipo === 'trecho' ? -1 : 1))
  const out: React.ReactNode[] = []
  let cur = bloco.ini
  let k = 0
  for (const m of ms) {
    const ini = Math.max(m.ini, cur, bloco.ini)
    const fim = Math.min(m.fim, bloco.fim)
    if (fim <= ini) continue
    if (ini > cur) out.push(bloco.texto.slice(cur - bloco.ini, ini - bloco.ini))
    const txt = bloco.texto.slice(ini - bloco.ini, fim - bloco.ini)
    if (m.tipo === 'trecho')
      out.push(
        <mark
          key={`${m.id}-${k++}`}
          id={`k-${m.id}-${bloco.n}`}
          data-k={m.id}
          className={cn(styles.key, ativoTrecho === m.id && styles.keyOn)}
          onClick={() => m.id && onTrecho(m.id)}
          title="Trecho-chave: clique para ver por que importa"
        >
          {txt}
        </mark>,
      )
    else
      out.push(
        <mark key={`s${m.k}-${k++}`} id={`m-${m.k}`} className={cn(styles.hit, m.tipo === 'busca-atual' && styles.hitOn)}>
          {txt}
        </mark>,
      )
    cur = fim
  }
  if (cur < bloco.fim) out.push(bloco.texto.slice(cur - bloco.ini))
  return (
    <p id={`b-${bloco.n}`} className={styles.p}>
      {out}
    </p>
  )
})

const ligacoes = (t: Trecho) => [
  ...(t.eleicoes_ids ?? []).map((id) => ({ k: `e${id}`, to: `/eleicoes?e=${id}`, label: `eleição: ${id}` })),
  ...(t.movimentos_ids ?? []).map((id) => ({ k: `m${id}`, to: `/eleicoes?aba=movimentos&m=${id}`, label: `movimento: ${id}` })),
  ...(t.historia_ids ?? []).map((id) => ({ k: `h${id}`, to: `/historia?sel=ev:${id}`, label: `história: ${id}` })),
  ...(t.indigenas_ids ?? []).map((id) => ({ k: `i${id}`, to: `/indigenas-eleicoes?i=${id}`, label: `indígenas: ${id}` })),
]

export type TextReaderProps = { doc: Doc; raw: string; trechoId: string | null; onTrecho: (id: string | null) => void }

/** Leitor de texto integral: busca com realce, trechos-chave por âncora, índice por artigo e verificação de hash no navegador. */
export function TextReader({ doc, raw, trechoId, onTrecho }: TextReaderProps) {
  const { cabecalho, corpo } = useMemo(() => splitTexto(raw), [raw])
  const blocos = useMemo(() => toBlocos(corpo), [corpo])
  const estrutura = useMemo(() => indiceEstrutural(blocos), [blocos])
  const trechos = doc.trechos_chave ?? []
  const keyPos = useMemo(() => trechos.map((t) => ({ t, pos: localizar(corpo, t.ancora) })), [trechos, corpo])

  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const hits = useMemo(() => (dq.trim().length >= 2 ? acharTermo(corpo, dq) : []), [corpo, dq])
  const [cur, setCur] = useState(0)
  useEffect(() => setCur(0), [dq, doc.id])

  const [hash, setHash] = useState<HashCheck | null>(null)
  const [hashBusy, setHashBusy] = useState(false)
  useEffect(() => setHash(null), [doc.id])
  const runHash = async () => {
    setHashBusy(true)
    try {
      setHash(await verifyHashes(raw, doc))
    } finally {
      setHashBusy(false)
    }
  }

  // marcas por bloco (busca binária no deslocamento de cada bloco)
  const marcasPorBloco = useMemo(() => {
    const map = new Map<number, Marca[]>()
    const find = (pos: number) => {
      let lo = 0
      let hi = blocos.length - 1
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if ((blocos[mid] as Bloco).ini <= pos) lo = mid
        else hi = mid - 1
      }
      return lo
    }
    const add = (n: number, m: Marca) => map.set(n, [...(map.get(n) ?? []), m])
    for (const { t, pos } of keyPos) if (pos && blocos.length) add(find(pos.ini), { ini: pos.ini, fim: pos.fim, tipo: 'trecho', id: t.id })
    const L = dq.trim().length
    hits.forEach((ini, k) => {
      const m: Marca = { ini, fim: ini + L, tipo: k === cur ? 'busca-atual' : 'busca', k }
      if (blocos.length) add(find(ini), m)
    })
    return map
  }, [blocos, keyPos, hits, cur, dq])

  const wrap = useRef<HTMLDivElement>(null)
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  }, [])
  useEffect(() => {
    if (!trechoId) return
    const h = requestAnimationFrame(() => {
      const el = wrap.current?.querySelector<HTMLElement>(`[data-k="${CSS.escape(trechoId)}"]`)
      if (el) scrollTo(el.id)
    })
    return () => cancelAnimationFrame(h)
  }, [trechoId, scrollTo, blocos])
  useEffect(() => {
    if (hits.length) requestAnimationFrame(() => scrollTo(`m-${cur}`))
  }, [cur, hits.length, scrollTo])

  const ativo = trechos.find((t) => t.id === trechoId) ?? null
  const conf = CONF_NIVEL(doc.conferencia?.status)
  const consolidada = doc.tipo_de_versao === 'consolidada'
  const espelhoPrivado = /privado/i.test(doc.origem?.tipo_de_fonte ?? '')
  const fonteUrl = doc.origem?.url ?? ''

  return (
    <div className={styles.root}>
      <header className={cn('card', styles.head)}>
        <div className={styles.titleRow}>
          <div>
            <h2 className={styles.title}>{doc.titulo}</h2>
            <p className={styles.sub}>
              {[doc.tipo, doc.autoridade, doc.data].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className={styles.badges}>
            <Badge tone={doc.status === 'vigente' ? 'pos' : 'neutral'}>{doc.status ?? 'status n/d'}</Badge>
            <Badge tone={consolidada ? 'warn' : 'brand'}>{doc.tipo_de_versao ?? 'versão n/d'}</Badge>
            <Badge tone={conf.nivel === 'conferido' ? 'pos' : conf.nivel === 'parcial' ? 'warn' : 'neutral'} title={doc.conferencia?.status ?? ''}>
              {conf.rotulo}
            </Badge>
            {doc.dominio_publico && <Badge>domínio público</Badge>}
          </div>
        </div>

        <dl className={styles.kv}>
          <dt>Fonte</dt>
          <dd>
            {fonteUrl ? (
              <a href={fonteUrl} target="_blank" rel="noreferrer">
                {doc.origem?.tipo_de_fonte ?? 'fonte'} <Icon name="external" size={12} />
              </a>
            ) : (
              '—'
            )}
            {doc.origem?.espelho ? ` · espelho: ${doc.origem.espelho}` : ''}
          </dd>
          <dt>Capturado em</dt>
          <dd>{doc.origem?.data_captura ? fDateTime(doc.origem.data_captura) : '—'}</dd>
          <dt>SHA-256 do corpo</dt>
          <dd>
            <code title={doc.origem?.sha256 ?? ''}>{shortHash(doc.origem?.sha256 ?? '—')}</code>
            {doc.origem?.sha256 && <CopyButton text={doc.origem.sha256} label="Copiar SHA-256 do corpo" />}
          </dd>
          {doc.origem?.sha256_arquivo && (
            <>
              <dt>SHA-256 do arquivo</dt>
              <dd>
                <code title={doc.origem.sha256_arquivo}>{shortHash(doc.origem.sha256_arquivo)}</code>
                <CopyButton text={doc.origem.sha256_arquivo} label="Copiar SHA-256 do arquivo" />
              </dd>
            </>
          )}
          <dt>Tamanho</dt>
          <dd>{doc.n_caracteres ? `${new Intl.NumberFormat('pt-BR').format(doc.n_caracteres)} caracteres` : '—'}</dd>
          {doc.texto_vigente_url && (
            <>
              <dt>Texto vigente</dt>
              <dd>
                <a href={doc.texto_vigente_url} target="_blank" rel="noreferrer">
                  consolidado no Planalto <Icon name="external" size={12} />
                </a>
              </dd>
            </>
          )}
        </dl>

        <div className={styles.hashRow}>
          <Button size="sm" variant="secondary" onClick={runHash} pending={hashBusy}>
            <Icon name="shield" size={14} /> Verificar hash no navegador
          </Button>
          {hash && (
            <ul className={styles.hashOut} role="status" aria-live="polite">
              <li>
                <Seal v={hash.corpo.ok} labels={{ yes: 'corpo: OK', no: 'corpo: divergente' }} />
                <code>{shortHash(hash.corpo.calculado)}</code>
                {!hash.corpo.ok && <span> esperado <code>{shortHash(hash.corpo.esperado)}</code></span>}
              </li>
              {hash.arquivo && (
                <li>
                  <Seal v={hash.arquivo.ok} labels={{ yes: 'arquivo: OK', no: 'arquivo: divergente' }} />
                  <code>{shortHash(hash.arquivo.calculado)}</code>
                  {!hash.arquivo.ok && <span> esperado <code>{shortHash(hash.arquivo.esperado)}</code></span>}
                </li>
              )}
            </ul>
          )}
          <span className={styles.hashNote}>O SHA-256 do índice vale para o corpo (após “=== TEXTO ===”, sem o último “\n”); recalculado aqui com SubtleCrypto.</span>
        </div>

        {(doc.conferencia?.observacoes || doc.conferencia?.lacunas) && (
          <details className={styles.det}>
            <summary>Como foi conferido e o que ficou de fora</summary>
            {doc.conferencia?.observacoes && <p>{doc.conferencia.observacoes}</p>}
            {doc.conferencia?.lacunas && (
              <p>
                <strong>Lacunas: </strong>
                {Array.isArray(doc.conferencia.lacunas) ? doc.conferencia.lacunas.join(' · ') : doc.conferencia.lacunas}
              </p>
            )}
            {(doc.conferencia?.conferido_contra?.length ?? 0) > 0 && (
              <ul>
                {doc.conferencia?.conferido_contra?.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </details>
        )}
        {cabecalho && (
          <details className={styles.det}>
            <summary>Cabeçalho de proveniência (como gravado no arquivo)</summary>
            <pre className={styles.pre}>{cabecalho}</pre>
          </details>
        )}
      </header>

      {consolidada && (
        <InlineNote id={`bib-cons-${doc.id}`} tone="warn" dismissible={false} title="Versão consolidada.">
          Este arquivo mostra o texto como a fonte o apresenta hoje (com alterações posteriores), não a redação sancionada na data do ato. Compare com a publicação original antes de citar.
        </InlineNote>
      )}
      {espelhoPrivado && (
        <InlineNote id={`bib-esp-${doc.id}`} tone="warn" dismissible={false} title="Transcrição de segunda mão.">
          A fonte é um espelho privado (não oficial) e não foi conferida contra a publicação da época. Trate como transcrição, não como edição crítica.
        </InlineNote>
      )}

      <div className={styles.layout}>
        <aside className={cn('card', styles.side)} aria-label="Trechos-chave e índice">
          <section>
            <p className={styles.lbl}>Trechos-chave ({trechos.length})</p>
            {trechos.length === 0 && <p className={styles.muted}>Sem trechos-chave marcados.</p>}
            <ul className={styles.keys}>
              {keyPos.map(({ t, pos }) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={cn(styles.keyBtn, trechoId === t.id && styles.keyBtnOn)}
                    aria-pressed={trechoId === t.id}
                    onClick={() => onTrecho(trechoId === t.id ? null : t.id)}
                  >
                    <span className={styles.keyLabel}>{t.rotulo}</span>
                    <span className={styles.keyTema}>{temaRotulo(t.tema)}</span>
                  </button>
                  {!pos && <span className={styles.warnLine}>âncora não localizada no texto</span>}
                </li>
              ))}
            </ul>
            {ativo && (
              <div className={styles.why} role="note">
                <p>{ativo.por_que_importa ?? 'Sem explicação registrada.'}</p>
                <ul className={styles.links}>
                  {ligacoes(ativo).map((l) => (
                    <li key={l.k}>
                      <Link to={l.to}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          {estrutura.length > 0 && (
            <section>
              <p className={styles.lbl}>Índice ({estrutura.length})</p>
              <ol className={styles.toc}>
                {estrutura.slice(0, 400).map((e) => (
                  <li key={e.n}>
                    <button type="button" onClick={() => scrollTo(`b-${e.n}`)}>{e.rotulo}</button>
                  </li>
                ))}
              </ol>
              {estrutura.length > 400 && <p className={styles.muted}>Mostrando os primeiros 400 itens; use a busca para o resto.</p>}
            </section>
          )}
        </aside>

        <div className={styles.main}>
          <div className={cn('card', styles.bar)} role="search">
            <label className={styles.search}>
              <Icon name="search" size={16} />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar neste texto (sem acento, sem diferenciar maiúsculas)…"
                aria-label="Buscar neste texto"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && hits.length) setCur((c) => (e.shiftKey ? (c - 1 + hits.length) % hits.length : (c + 1) % hits.length))
                }}
              />
            </label>
            <span className={styles.count} aria-live="polite">
              {dq.trim().length < 2 ? 'digite 2+ letras' : hits.length === 0 ? 'nenhum resultado' : `${cur + 1} de ${hits.length}${hits.length >= 2000 ? '+' : ''}`}
            </span>
            <Button size="sm" variant="ghost" disabled={!hits.length} onClick={() => setCur((c) => (c - 1 + hits.length) % hits.length)} aria-label="Resultado anterior">↑</Button>
            <Button size="sm" variant="ghost" disabled={!hits.length} onClick={() => setCur((c) => (c + 1) % hits.length)} aria-label="Próximo resultado">↓</Button>
          </div>
          <article ref={wrap} className={cn('card', styles.text)} lang="pt-BR" aria-label={`Texto integral: ${doc.titulo}`}>
            {blocos.map((b) => (
              <BlocoView key={b.n} bloco={b} marcas={marcasPorBloco.get(b.n) ?? []} ativoTrecho={trechoId} onTrecho={onTrecho} />
            ))}
          </article>
        </div>
      </div>
    </div>
  )
}
