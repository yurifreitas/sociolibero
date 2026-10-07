import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Seal } from '@/components/molecules/Seal'
import { hrefTrecho, type TrechoRef } from '@/features/biblioteca/model'
import { espectroLabel } from '@/features/eleicoes/model'
import type { Eleicao, Movimento } from '@/features/eleicoes/schemas'
import styles from './ElectionPanel.module.css'

const Fonte = ({ titulo, url }: { titulo?: string | null; url?: string | null }) =>
  url ? (
    <a href={url} target="_blank" rel="noreferrer" className={styles.src}>
      {titulo && titulo.length > 80 ? `${titulo.slice(0, 80)}…` : (titulo ?? 'fonte')} <Icon name="external" size={11} />
    </a>
  ) : (
    <span className={styles.src}>{titulo ?? 'sem fonte aberta'}</span>
  )

const Lst = ({ xs }: { xs?: string[] | null }) => ((xs?.length ?? 0) > 0 ? <ul className={styles.list}>{xs?.map((x) => <li key={x}>{x}</li>)}</ul> : <p className={styles.muted}>—</p>)

export type MovementPanelProps = { m: Movimento; eleicoes: Map<string, Eleicao>; biblioteca: TrechoRef[]; onEleicao: (id: string) => void; onClose: () => void }

/**
 * Painel de movimento: “como se construiu” em passos datados ao lado do que é disputado, mais a estrutura comum
 * (base social, organização, mídia, financiamento e regras, alianças, viradas, resultado, declínio) — igual para todos os espectros.
 */
export function MovementPanel({ m, eleicoes, biblioteca, onEleicao, onClose }: MovementPanelProps) {
  const passos = [...(m.como_se_construiu ?? [])].sort((a, b) => (a.passo ?? 0) - (b.passo ?? 0))
  return (
    <article className={`card ${styles.panel}`} aria-label={m.nome}>
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>Movimento · {m.periodo ?? 'período n/d'}</p>
          <h3 className={styles.title}>{m.nome}</h3>
          <div className={styles.badges}>
            <Badge tone="brand" title="Rótulo editorial, aplicado com o mesmo método a todos os movimentos">espectro: {espectroLabel(m.espectro)}</Badge>
          </div>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar o painel"><Icon name="x" size={16} /></button>
      </header>

      {m.origem && <section><p className={styles.lbl}>Origem e contexto</p><p className={styles.text}>{m.origem}</p></section>}

      <section className={styles.versus} aria-label="Como se construiu e o que é disputado">
        <div>
          <p className={styles.lbl}>Como se construiu ({passos.length} passos datados)</p>
          <ol className={styles.steps}>
            {passos.map((p, i) => (
              <li key={`${p.passo}-${i}`}>
                <span className={styles.stepDate}>{p.data ?? '—'}</span>
                <span className={styles.stepText}>
                  {p.descricao} <Seal v={p.verificado} labels={{ yes: 'lido', no: 'não verificado' }} />
                  {p.url && <> <Fonte titulo={p.fonte} url={p.url} /></>}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.dispute}>
          <p className={styles.lbl}>O que se sabe e o que é disputado</p>
          <p className={styles.text}>{m.controversias ?? 'Sem controvérsia registrada.'}</p>
          {m.declinio_ou_transformacao && (<><p className={styles.lbl}>Declínio ou transformação</p><p className={styles.text}>{m.declinio_ou_transformacao}</p></>)}
        </div>
      </section>

      <section className={styles.grid3}>
        <div><p className={styles.lbl}>Pautas</p><Lst xs={m.pautas} /></div>
        <div><p className={styles.lbl}>Base social</p><p className={styles.text}>{m.base_social ?? '—'}</p></div>
        <div><p className={styles.lbl}>Organização</p><Lst xs={m.organizacao} /></div>
        <div><p className={styles.lbl}>Mídia e tecnologia</p><Lst xs={m.midia_e_tecnologia} /></div>
        <div><p className={styles.lbl}>Financiamento e regras</p><p className={styles.text}>{m.financiamento_e_regras ?? '—'}</p></div>
        <div><p className={styles.lbl}>Alianças e rupturas</p><Lst xs={m.aliancas_e_rupturas} /></div>
      </section>

      {(m.viradas?.length ?? 0) > 0 && (
        <section aria-label="Viradas">
          <p className={styles.lbl}>Viradas ({m.viradas?.length})</p>
          <ul className={styles.steps}>
            {m.viradas?.map((v, i) => (
              <li key={`${v.data}-${i}`}>
                <span className={styles.stepDate}>{v.data ?? '—'}</span>
                <span className={styles.stepText}>{v.fato} <Seal v={v.verificado} labels={{ yes: 'lido', no: 'não verificado' }} /> {v.url && <Fonte titulo={v.fonte} url={v.url} />}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(m.resultado_eleitoral?.length ?? 0) > 0 && (
        <section aria-label="Resultado eleitoral">
          <p className={styles.lbl}>Resultado eleitoral</p>
          <ul className={styles.list}>
            {m.resultado_eleitoral?.map((r, i) => (
              <li key={`${r.eleicao_id}-${i}`}>
                {r.eleicao_id && eleicoes.has(r.eleicao_id) ? <button type="button" className={styles.inline} onClick={() => onEleicao(r.eleicao_id as string)}>{eleicoes.get(r.eleicao_id)?.ano} · {eleicoes.get(r.eleicao_id)?.cargo}</button> : <strong>{r.eleicao_id}</strong>}: {r.desempenho} <Seal v={r.verificado} /> {r.url && <Fonte titulo={r.fonte} url={r.url} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Ligações" className={styles.links}>
        {(m.eleicoes_ids?.length ?? 0) > 0 && (
          <div><p className={styles.lbl}>Eleições ligadas</p>
            <ul className={styles.chips}>{m.eleicoes_ids?.map((id) => <li key={id}><button type="button" onClick={() => onEleicao(id)}>{eleicoes.get(id) ? `${eleicoes.get(id)?.ano} · ${eleicoes.get(id)?.cargo.slice(0, 36)}` : id}</button></li>)}</ul>
          </div>
        )}
        {biblioteca.length > 0 && (
          <div><p className={styles.lbl}>Textos originais ({biblioteca.length})</p>
            <ul className={styles.chips}>{biblioteca.slice(0, 8).map((b) => <li key={`${b.doc.id}-${b.trecho.id}`}><Link to={hrefTrecho(b)} title={b.trecho.por_que_importa ?? ''}><Icon name="book" size={12} /> {b.trecho.rotulo}</Link></li>)}</ul>
          </div>
        )}
      </section>

      {(m.fontes?.length ?? 0) > 0 && (
        <section aria-label="Fontes">
          <p className={styles.lbl}>Fontes</p>
          <ul className={styles.srcList}>{m.fontes?.map((f, i) => <li key={`${f.url}-${i}`}><Seal v={f.verificado} /> <Fonte titulo={f.titulo} url={f.url} /></li>)}</ul>
        </section>
      )}
    </article>
  )
}
