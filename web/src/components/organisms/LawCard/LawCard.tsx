import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { RefItem } from '@/components/molecules/RefItem'
import type { Lei } from '@/features/futuro/schemas'
import styles from './LawCard.module.css'

/** Fórmula em KaTeX (carregado sob demanda). Sem LaTeX ou com falha, cai para o texto simples. */
function Formula({ latex, plain }: { latex?: string | null; plain?: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    if (!latex) return
    Promise.all([import('katex'), import('katex/dist/katex.min.css')])
      .then(([k]) => {
        if (!alive || !ref.current) return
        k.default.render(latex, ref.current, { throwOnError: false, displayMode: true })
        setOk(true)
      })
      .catch(() => setOk(false))
    return () => {
      alive = false
    }
  }, [latex])
  if (!latex && !plain) return null
  return (
    <div className={styles.formula} role="math" aria-label={plain ?? latex ?? 'fórmula'}>
      <div ref={ref} aria-hidden="true" hidden={!ok} />
      {!ok && <code>{plain ?? latex}</code>}
    </div>
  )
}

const asList = (v: string | string[] | null | undefined) => (Array.isArray(v) ? v : v ? [v] : [])

/** Lei empírica: fórmula, parâmetros com selo, domínio de validade, críticas, relevância para o Brasil e referências. */
export function LawCard({ lei }: { lei: Lei }) {
  const dom = asList(lei.dominio_validade)
  const cri = asList(lei.criticas)
  return (
    <article className={`card ${styles.card}`}>
      <header className={styles.head}>
        <div>
          <h3 className={styles.name}>{lei.nome}</h3>
          <p className={styles.by}>{[lei.autor, lei.ano != null ? String(lei.ano) : ''].filter(Boolean).join(' · ')}</p>
        </div>
      </header>
      <Formula latex={lei.formula_latex} plain={lei.formula} />
      {lei.descricao && <p className={styles.desc}>{lei.descricao}</p>}

      {lei.parametros_empiricos && lei.parametros_empiricos.length > 0 && (
        <section aria-label="Parâmetros empíricos">
          <h4 className={styles.h}>Parâmetros empíricos</h4>
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead><tr><th scope="col">Valor</th><th scope="col">Período</th><th scope="col">Fonte</th><th scope="col">Selo</th></tr></thead>
              <tbody>
                {lei.parametros_empiricos.map((p, i) => (
                  <tr key={i}>
                    <td className="num">{p.valor ?? '—'}</td>
                    <td>{p.periodo ?? '—'}</td>
                    <td>{p.fonte ?? '—'}</td>
                    <td><Badge tone={p.verificado ? 'pos' : 'warn'}>{p.verificado ? 'verificado' : 'a confirmar'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className={styles.cols}>
        {dom.length > 0 && (
          <section>
            <h4 className={styles.h}>Onde vale</h4>
            <ul className={styles.ul}>{dom.map((d) => <li key={d}>{d}</li>)}</ul>
          </section>
        )}
        {cri.length > 0 && (
          <section>
            <h4 className={styles.h}>Críticas</h4>
            <ul className={styles.ul}>{cri.map((d) => <li key={d}>{d}</li>)}</ul>
          </section>
        )}
      </div>

      {(lei.estado_atual || lei.relevancia_brasil) && (
        <div className={styles.facts}>
          {lei.estado_atual && <p><b>Estado atual.</b> {lei.estado_atual}</p>}
          {lei.relevancia_brasil && <p><b>Relevância para o Brasil.</b> {lei.relevancia_brasil}</p>}
        </div>
      )}

      {lei.referencias && lei.referencias.length > 0 && (
        <section>
          <h4 className={styles.h}><Icon name="book" size={13} /> Referências</h4>
          <ul className={styles.refs}>
            {lei.referencias.map((r) => (
              <RefItem key={r.titulo} r={{ id: r.titulo, titulo: r.titulo, url: r.url ?? (r.doi ? `https://doi.org/${r.doi}` : null), seal: r.verificado ? 'verificado' : 'a confirmar', meta: r.doi ? `doi:${r.doi}` : undefined }} />
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
