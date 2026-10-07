import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'
import { Select } from '@/components/atoms/Select'
import { Skeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ErrorState } from '@/components/molecules/ErrorState'
import { InlineNote } from '@/components/molecules/InlineNote'
import { PageGate } from '@/components/molecules/PageGate'
import { SectionHeader } from '@/components/molecules/SectionHeader'
import { TextReader } from '@/components/organisms/TextReader'
import { PageTemplate } from '@/components/templates/PageTemplate'
import { useTextoBruto, useTextosIndex } from '@/features/biblioteca/hooks'
import { CONF_NIVEL, norm, temaRotulo, temasDoc } from '@/features/biblioteca/model'
import type { Doc, TextosIndex } from '@/features/biblioteca/schemas'
import { fInt } from '@/lib/format'
import { useUrlState } from '@/lib/useUrlState'
import k from './know.module.css'
import s from './BibliotecaPage.module.css'

const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

function Leitura({ doc }: { doc: Doc }) {
  const { get, update } = useUrlState()
  const q = useTextoBruto(doc.arquivo)
  return (
    <div className={k.stack}>
      <p>
        <button type="button" className={s.back} onClick={() => update({ id: null, trecho: null })}>
          <Icon name="arrowRight" size={14} style={{ transform: 'scaleX(-1)' }} /> Voltar ao índice
        </button>
      </p>
      {q.isPending && (
        <div aria-busy="true" aria-label="Carregando o texto" style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <Skeleton height={180} style={{ borderRadius: 16 }} />
          <Skeleton height={420} style={{ borderRadius: 16 }} />
        </div>
      )}
      {q.isError && <ErrorState message={(q.error as Error).message} onRetry={() => void q.refetch()} />}
      {q.data && <TextReader doc={doc} raw={q.data} trechoId={get('trecho')} onTrecho={(t) => update({ trecho: t })} />}
    </div>
  )
}

function DocCard({ d }: { d: Doc }) {
  const conf = CONF_NIVEL(d.conferencia?.status)
  const temas = temasDoc(d)
  const consolidada = d.tipo_de_versao === 'consolidada'
  const trechos = d.trechos_chave ?? []
  return (
    <article className={`card ${k.pad}`}>
      <header className={k.head}>
        <div>
          <h3 className={k.title}>{d.titulo}</h3>
          <p className={k.sub}>{[d.tipo, d.ano ?? d.data, d.autoridade].filter(Boolean).join(' · ')}</p>
        </div>
        <Badge tone={d.status === 'vigente' ? 'pos' : 'neutral'}>{d.status ?? '—'}</Badge>
      </header>
      <div className={s.badges}>
        <Badge tone={consolidada ? 'warn' : 'brand'}>{d.tipo_de_versao ?? 'versão n/d'}</Badge>
        <Badge tone={conf.nivel === 'conferido' ? 'pos' : conf.nivel === 'parcial' ? 'warn' : 'neutral'} title={d.conferencia?.status ?? ''}>
          {conf.rotulo}
        </Badge>
        {d.n_caracteres ? <span className={k.tagc}>{fInt(d.n_caracteres)} caracteres</span> : null}
        <span className={k.tagc}>{trechos.length} trechos-chave</span>
      </div>
      {temas.length > 0 && (
        <ul className={k.chips} aria-label="Temas dos trechos-chave">
          {temas.slice(0, 6).map((t) => (
            <li key={t}>{temaRotulo(t)}</li>
          ))}
        </ul>
      )}
      {trechos.length > 0 && (
        <ul className={s.quick}>
          {trechos.slice(0, 2).map((t) => (
            <li key={t.id}>
              <Link to={`/biblioteca?id=${d.id}&trecho=${t.id}`}>{t.rotulo}</Link>
            </li>
          ))}
        </ul>
      )}
      <p className={s.actions}>
        <Link className={s.read} to={`/biblioteca?id=${d.id}`}>
          Ler o texto integral <Icon name="arrowRight" size={14} />
        </Link>
      </p>
    </article>
  )
}

function SemTexto({ d }: { d: Doc }) {
  return (
    <article className={`card ${k.pad} ${s.sem}`}>
      <header className={k.head}>
        <div>
          <h3 className={k.title}>{d.titulo}</h3>
          <p className={k.sub}>{[d.tipo, d.ano ?? d.data, d.autoridade].filter(Boolean).join(' · ')}</p>
        </div>
        <Badge tone="warn">sem texto integral</Badge>
      </header>
      <p className={k.text}>{d.motivo_sem_texto ?? 'Texto não incluído.'}</p>
      {d.resultado_votacao != null && typeof d.resultado_votacao === 'object' && (
        <p className={k.muted}>
          Resultado registrado: {Object.entries(d.resultado_votacao as Record<string, unknown>)
            .filter(([key]) => ['data', 'sim', 'nao', 'abstencao', 'faltaram_para_aprovar'].includes(key))
            .map(([key, v]) => `${key.replaceAll('_', ' ')}: ${String(v)}`)
            .join(' · ')}
        </p>
      )}
      {(d.links ?? []).length > 0 && (
        <ul className={k.links}>
          {d.links?.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.rotulo.length > 70 ? `${l.rotulo.slice(0, 70)}…` : l.rotulo} <Icon name="external" size={12} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

function Indice({ d }: { d: TextosIndex }) {
  const { get, update } = useUrlState()
  const tipo = get('tipo') ?? ''
  const status = get('status') ?? ''
  const versao = get('versao') ?? ''
  const conf = get('conf') ?? ''
  const tema = get('tema') ?? ''
  const q = get('q') ?? ''

  const tipos = useMemo(() => uniq(d.documentos.map((x) => x.tipo)), [d.documentos])
  const temas = useMemo(() => uniq(d.documentos.flatMap(temasDoc)), [d.documentos])
  const nq = norm(q.trim())
  const lista = useMemo(
    () =>
      d.documentos
        .filter((x) => (!tipo || x.tipo === tipo) && (!status || x.status === status) && (!versao || x.tipo_de_versao === versao) && (!conf || CONF_NIVEL(x.conferencia?.status).nivel === conf) && (!tema || temasDoc(x).includes(tema)))
        .filter((x) => {
          if (nq.length < 2) return true
          const hay = norm([x.titulo, x.autoridade ?? '', x.tipo ?? '', ...(x.trechos_chave ?? []).flatMap((t) => [t.rotulo, t.por_que_importa ?? '', temaRotulo(t.tema)])].join(' '))
          return hay.includes(nq)
        })
        .sort((a, b) => (a.ano ?? 0) - (b.ano ?? 0)),
    [d.documentos, tipo, status, versao, conf, tema, nq],
  )
  const sem = d.sem_texto_integral ?? []
  const ok = d.documentos.filter((x) => CONF_NIVEL(x.conferencia?.status).nivel === 'conferido').length
  const parcial = d.documentos.filter((x) => CONF_NIVEL(x.conferencia?.status).nivel === 'parcial').length
  const unica = d.documentos.filter((x) => CONF_NIVEL(x.conferencia?.status).nivel === 'unica').length
  const ancoras = d.documentos.reduce((n, x) => n + (x.trechos_chave?.length ?? 0), 0)
  const privado = d.documentos.filter((x) => /privado/i.test(x.origem?.tipo_de_fonte ?? ''))

  return (
    <div className={k.stack}>
      <div className={s.fixed}>
        <InlineNote id="bib-dominio" tone="info" baseId="biblioteca-fontes" dismissible={false} title="Domínio público.">
          Leis, decretos e atos oficiais não têm direito autoral (Lei 9.610/98, art. 8º, IV). Obras ainda protegidas aparecem só com metadados e link. {d.meta?.como_verificar_hash ?? ''}
        </InlineNote>
        <InlineNote id="bib-erros" tone="warn" dismissible={false} title="Erros da fonte foram preservados.">
          O texto é o da publicação consultada, com a ortografia de época e até erros de transcrição da fonte (por exemplo, “Art.. 81”). Nada foi “consertado”. Cada documento diz se é original de época ou consolidado e quão conferido está; “conferido” é teste de coincidência por script contra uma segunda fonte, não revisão jurídica.
        </InlineNote>
        {privado.length > 0 && (
          <InlineNote id="bib-privado" tone="warn" dismissible={false} title="Segunda mão.">
            {privado.map((x) => x.titulo).join('; ')}: transcrição de espelho privado, não oficial e não conferida contra a publicação da época.
          </InlineNote>
        )}
      </div>

      <div className={k.stats}>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Textos integrais</p><p className={s.big}>{d.documentos.length}</p><p className={k.muted}>{fInt(d.meta?.n_caracteres_total ?? 0)} caracteres</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Conferidos contra a fonte</p><p className={s.big}>{ok}</p><p className={k.muted}>{parcial} parciais · {unica} de fonte única</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Trechos-chave</p><p className={s.big}>{ancoras}</p><p className={k.muted}>âncoras localizadas por script</p></div>
        <div className="card" style={{ padding: 'var(--space-4)' }}><p className={k.lbl}>Só metadados</p><p className={s.big}>{sem.length}</p><p className={k.muted}>direitos autorais ou texto não obtido</p></div>
      </div>

      <div className={k.filters} role="group" aria-label="Filtros da biblioteca">
        <label className={k.search}>
          Buscar
          <input type="search" value={q} onChange={(e) => update({ q: e.target.value || null })} placeholder="título, tema ou trecho-chave…" />
        </label>
        <label className={s.sel}>Tipo<Select value={tipo} onChange={(e) => update({ tipo: e.target.value || null })}><option value="">todos</option>{tipos.map((t) => <option key={t} value={t}>{t}</option>)}</Select></label>
        <label className={s.sel}>Status<Select value={status} onChange={(e) => update({ status: e.target.value || null })}><option value="">todos</option><option value="vigente">vigente</option><option value="revogado">revogado</option><option value="histórico">histórico</option></Select></label>
        <label className={s.sel}>Versão<Select value={versao} onChange={(e) => update({ versao: e.target.value || null })}><option value="">todas</option><option value="original de época">original de época</option><option value="consolidada">consolidada</option></Select></label>
        <label className={s.sel}>Conferência<Select value={conf} onChange={(e) => update({ conf: e.target.value || null })}><option value="">todas</option><option value="conferido">conferido contra a fonte</option><option value="parcial">parcial</option><option value="unica">fonte única</option></Select></label>
        <label className={s.sel}>Tema<Select value={tema} onChange={(e) => update({ tema: e.target.value || null })}><option value="">todos</option>{temas.map((t) => <option key={t} value={t}>{temaRotulo(t)}</option>)}</Select></label>
      </div>

      <p className={k.muted} aria-live="polite">{lista.length} de {d.documentos.length} textos</p>
      {lista.length === 0 ? (
        <EmptyState icon="search" title="Nenhum texto com esses filtros">Limpe a busca ou os filtros para ver o acervo inteiro.</EmptyState>
      ) : (
        <div className={s.grid}>{lista.map((x) => <DocCard key={x.id} d={x} />)}</div>
      )}

      {sem.length > 0 && (
        <section aria-labelledby="bib-sem" className={k.stack}>
          <h2 id="bib-sem" className={s.h2}>Só metadados e link ({sem.length})</h2>
          <p className={k.text}>Documentos que não reproduzimos: ou a obra ainda está protegida por direito autoral, ou o texto integral não foi obtido em formato aberto e confiável. O motivo está em cada cartão.</p>
          <div className={s.grid}>{sem.map((x) => <SemTexto key={x.id} d={x} />)}</div>
        </section>
      )}
    </div>
  )
}

function Content({ d }: { d: TextosIndex }) {
  const { get } = useUrlState()
  const doc = d.documentos.find((x) => x.id === get('id'))
  if (get('id') && !doc) {
    const sem = (d.sem_texto_integral ?? []).find((x) => x.id === get('id'))
    return sem ? <SemTexto d={sem} /> : <EmptyState icon="search" title="Documento não encontrado">Não há documento com o id <code>{get('id')}</code> na biblioteca.</EmptyState>
  }
  return doc ? <Leitura doc={doc} /> : <Indice d={d} />
}

export default function BibliotecaPage() {
  const q = useTextosIndex()
  return (
    <PageTemplate>
      <SectionHeader level={1} title="Biblioteca de textos originais" description="Constituições, leis eleitorais, atos institucionais e manifestos, em texto integral para consulta: com a fonte, a data de captura, o SHA-256 que você mesmo pode verificar no navegador e os trechos-chave que sustentam a linha do tempo das eleições." />
      <PageGate query={q} file="textos_index.json">{(d) => <Content d={d} />}</PageGate>
    </PageTemplate>
  )
}
