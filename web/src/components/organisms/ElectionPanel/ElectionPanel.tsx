import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Seal } from '@/components/molecules/Seal'
import { hrefTrecho, type TrechoRef } from '@/features/biblioteca/model'
import { espectroLabel, fmtVal, nCampo, TIPOS, votos } from '@/features/eleicoes/model'
import type { Eleicao, Movimento, Revisao } from '@/features/eleicoes/schemas'
import { fNum1 } from '@/lib/format'
import { isMarco } from '../ElectionTimeline'
import styles from './ElectionPanel.module.css'

const Tri = ({ v, sim = 'sim', nao = 'não' }: { v: boolean | null | undefined; sim?: string; nao?: string }) =>
  v === true ? <Badge tone="brand">{sim}</Badge> : v === false ? <Badge>{nao}</Badge> : <Badge tone="warn">sem dado</Badge>

const Fonte = ({ titulo, url }: { titulo?: string | null; url?: string | null }) =>
  url ? (
    <a href={url} target="_blank" rel="noreferrer" className={styles.src}>
      {titulo && titulo.length > 90 ? `${titulo.slice(0, 90)}…` : (titulo ?? 'fonte')} <Icon name="external" size={11} />
    </a>
  ) : (
    <span className={styles.src}>{titulo ?? 'sem fonte aberta'}</span>
  )

export function RevisaoList({ rs }: { rs: Revisao[] }) {
  if (rs.length === 0) return null
  return (
    <section aria-label="Correções feitas na revisão de fontes">
      <p className={styles.lbl}>Revisão de fontes ({rs.length})</p>
      <ul className={styles.rev}>
        {rs.map((r, i) => (
          <li key={`${r.id}-${r.campo}-${i}`}>
            <p className={styles.revHead}>
              <strong>{nCampo(r.campo)}</strong>
              <Seal v={r.verificado} labels={{ yes: 'lido na fonte', no: 'não verificado' }} />
            </p>
            <div className={styles.diff}>
              <div><span className={styles.dl}>antes</span><p className={styles.antes}>{fmtVal(r.antes)}</p></div>
              <div><span className={styles.dl}>depois</span><p className={styles.depois}>{fmtVal(r.depois)}</p></div>
            </div>
            {r.motivo && <p className={styles.motivo}>{r.motivo}</p>}
            {r.fonte && <Fonte titulo={r.fonte.titulo} url={r.fonte.url} />}
          </li>
        ))}
      </ul>
    </section>
  )
}

export type ElectionPanelProps = {
  e: Eleicao
  revisoes: Revisao[]
  biblioteca: TrechoRef[]
  movimentos: Map<string, Movimento>
  onMovimento: (id: string) => void
  onClose: () => void
}

/** Painel de uma eleição ou marco de regra: regras de voto, números com selo e fonte, ligações e o que a revisão corrigiu. */
export function ElectionPanel({ e, revisoes, biblioteca, movimentos, onMovimento, onClose }: ElectionPanelProps) {
  const r = e.regras_de_voto
  const el = e.eleitorado
  const co = e.comparecimento
  const res = e.resultados ?? []
  return (
    <article className={`card ${styles.panel}`} aria-label={`${e.ano}: ${e.cargo}`}>
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>{isMarco(e) ? 'Marco de regra' : 'Eleição'} · {e.data ?? e.ano}</p>
          <h3 className={styles.title}>{e.ano} · {e.cargo}</h3>
          <div className={styles.badges}>
            <Badge tone="brand">{TIPOS.find((t) => t.key === e.tipo)?.label ?? e.tipo}</Badge>
            {e.regime && <Badge>{e.regime}</Badge>}
          </div>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar o painel"><Icon name="x" size={16} /></button>
      </header>

      <section aria-label="Regras de voto" className={styles.sec}>
        <p className={styles.lbl}>Quem podia votar <Seal v={r?.regras_verificado} labels={{ yes: 'regra lida no texto legal', no: 'regra não verificada' }} /></p>
        <p className={styles.text}>{r?.quem_votava ?? 'Sem descrição das regras de voto.'}</p>
        <ul className={styles.rules}>
          <li><span>Voto secreto</span><Tri v={r?.voto_secreto} /></li>
          <li><span>Mulheres votam</span><Tri v={r?.mulheres} /></li>
          <li><span>Analfabetos votam</span><Tri v={r?.analfabetos} /></li>
          <li><span>Voto obrigatório</span><Tri v={r?.obrigatorio} /></li>
          <li><span>Idade mínima</span>{r?.idade_minima != null ? <Badge tone="brand">{r.idade_minima} anos</Badge> : <Badge tone="warn">sem dado</Badge>}</li>
        </ul>
      </section>

      <section className={styles.two} aria-label="Eleitorado e comparecimento">
        <div>
          <p className={styles.lbl}>Eleitorado <Seal v={el?.verificado} /></p>
          <p className={styles.big}>{fmtVal(el?.valor)}</p>
          <p className={styles.muted}>{el?.pct_populacao != null ? `${fNum1(el.pct_populacao)}% da população` : 'percentual da população: sem dado na fonte'}{el?.tipo ? ` · ${el.tipo}` : ''}</p>
          {el?.fonte && <Fonte titulo={el.fonte} url={el.url} />}
          {el?.nota && <p className={styles.note}>{el.nota}</p>}
        </div>
        <div>
          <p className={styles.lbl}>Comparecimento <Seal v={co?.verificado} /></p>
          <p className={styles.big}>{co?.valor != null ? fmtVal(co.valor) : '—'}</p>
          <p className={styles.muted}>{co?.pct != null ? `${fNum1(co.pct)}% dos aptos` : 'sem dado'}</p>
          {co?.fonte && <Fonte titulo={co.fonte} url={co.url} />}
          {co?.nota && <p className={styles.note}>{co.nota}</p>}
        </div>
      </section>

      {(e.sistema || e.financiamento) && (
        <section className={styles.two} aria-label="Sistema e financiamento">
          {e.sistema && <div><p className={styles.lbl}>Sistema</p><p className={styles.text}>{e.sistema}</p></div>}
          {e.financiamento && <div><p className={styles.lbl}>Financiamento</p><p className={styles.text}>{e.financiamento}</p></div>}
        </section>
      )}

      {res.length > 0 && (
        <section aria-label="Resultados">
          <p className={styles.lbl}>Resultados ({res.length})</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Candidato</th><th>Partido</th><th className={styles.n}>Votos</th><th className={styles.n}>%</th><th>Fonte</th></tr></thead>
              <tbody>
                {res.map((x, i) => (
                  <tr key={`${x.candidato}-${i}`}>
                    <td>{x.candidato ?? '—'}</td>
                    <td>{x.partido ?? '—'}</td>
                    <td className={styles.n}>{votos(x.votos)}</td>
                    <td className={styles.n}>{x.pct != null ? fNum1(x.pct) : '—'}</td>
                    <td><Seal v={x.verificado} /> {x.fonte && <Fonte titulo={x.fonte} url={x.url} />}{x.nota && <span className={styles.note}> {x.nota}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(e.mudancas_de_regra?.length ?? 0) > 0 && (
        <section aria-label="Mudanças de regra">
          <p className={styles.lbl}>Mudanças de regra</p>
          <ul className={styles.list}>{e.mudancas_de_regra?.map((m) => <li key={m}>{m}</li>)}</ul>
        </section>
      )}

      <section aria-label="Ligações" className={styles.links}>
        {(e.movimentos_ids?.length ?? 0) > 0 && (
          <div><p className={styles.lbl}>Movimentos</p>
            <ul className={styles.chips}>{e.movimentos_ids?.map((id) => <li key={id}><button type="button" onClick={() => onMovimento(id)}>{movimentos.get(id)?.nome.replace(/\s*\(.*$/, '') ?? id}{movimentos.get(id) ? ` · ${espectroLabel(movimentos.get(id)?.espectro)}` : ''}</button></li>)}</ul>
          </div>
        )}
        {(e.eventos_historia_ids?.length ?? 0) > 0 && (
          <div><p className={styles.lbl}>História institucional</p>
            <ul className={styles.chips}>{e.eventos_historia_ids?.map((id) => <li key={id}><Link to={`/historia?sel=ev:${id}`}>{id}</Link></li>)}</ul>
          </div>
        )}
        {biblioteca.length > 0 && (
          <div><p className={styles.lbl}>Textos originais ({biblioteca.length})</p>
            <ul className={styles.chips}>{biblioteca.slice(0, 8).map((b) => <li key={`${b.doc.id}-${b.trecho.id}`}><Link to={hrefTrecho(b)} title={b.trecho.por_que_importa ?? ''}><Icon name="book" size={12} /> {b.trecho.rotulo}</Link></li>)}</ul>
          </div>
        )}
      </section>

      <RevisaoList rs={revisoes} />

      {(e.fontes?.length ?? 0) > 0 && (
        <section aria-label="Fontes">
          <p className={styles.lbl}>Fontes</p>
          <ul className={styles.srcList}>{e.fontes?.map((f, i) => <li key={`${f.url}-${i}`}><Seal v={f.verificado} /> <Fonte titulo={f.titulo} url={f.url} /></li>)}</ul>
        </section>
      )}
      {e.nota && <p className={styles.note}>{e.nota}</p>}
    </article>
  )
}
