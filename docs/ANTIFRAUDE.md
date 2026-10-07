# Antifraude: duas famílias, um mesmo critério de evidência

Este repositório (**sociolibero**) e o projeto irmão **Arandu / trans** (`Documents/code/trans`) cobrem frentes
complementares de detecção de irregularidade a partir de dados públicos. Ambos seguem a regra de ouro:
**indício estatístico não é prova**; o que se entrega é *triagem para auditoria*, com a fonte, a fórmula e a incerteza visíveis.

| Família | Pergunta | Onde está | Unidade | Dados |
|---|---|---|---|---|
| **A. Apuração eleitoral** | Os números de votação de um município fogem do padrão local ou de padrões numéricos esperados? | `src/sociolibero/eleicoes/` | município / seção | TSE (votação por seção, detalhe), IBGE |
| **B. Dinheiro público** | Quem recebe dinheiro público, com quais vínculos, e quais padrões atípicos aparecem? | projeto Arandu/trans (`backend/app/services/fraude.py`) | parlamentar, fornecedor (CNPJ), contrato | Câmara (CEAP), Senado (CEAPS), PNCP, TSE (doações), CGU (CEIS/CNEP), Receita |

## Os gatilhos da família B (resumo do projeto trans)
**Cruzamento de bases (mais graves):** ciclo de retroalimentação (cota paga a empresa cujo sócio doou à campanha do mesmo
parlamentar); fornecedor sancionado com sanção vigente; doador que vira fornecedor; doador contratado (federal e municipal);
fornecedor com sócio de sobrenome raro compartilhado com o parlamentar; sócio homônimo.
**Padrão estatístico:** concentração em um fornecedor (anual e acumulada); notas repetidas de mesmo valor; empresa recém-aberta;
situação cadastral irregular; fracionamento abaixo do limite de dispensa; dispensa de alto valor; fornecedor que atende muitos parlamentares.
Pontuação: severidade alta ×5, média ×2, baixa ×1. Detalhes e limiares: `trans/docs/radar-de-fraude.md`.

## Princípios comuns (já implementados em cada lado)
1. **Proveniência**: fonte, data de extração, versão/hash e fórmula em cada número (A: `PROVENIENCIA.json` com SHA-256; B: `docs/fontes-de-dados.md` com URLs e armadilhas).
2. **Reconciliação antes de testar**: A confere a soma por seção contra os totais publicados (diferença 0); B revisou números em revisão adversarial e corrigiu dupla contagem (R$ 17,2 bi → 12,4 bi).
3. **Identidade ≠ causa**: cruzar por CNPJ/nome mostra escala e acende alerta; homônimos e sobrenomes comuns geram falso positivo (B ignora sobrenomes comuns; A compara com vizinhos).
4. **Não somar o que não é somável** (métodos e períodos distintos).
5. **Linguagem não acusatória** e aviso fixo na interface.

## O que cada lado tem e o outro não (oportunidades)
- **A tem e B não:** *validação sintética dos detectores* (fraude injetada com verdade conhecida → TPR/FPR por detector), calibração em dados reais (fração com p<0,05 ≈ 5%) e teste de persistência entre pleitos (flags que se repetem = estrutura, não evento). **Aplicar aos 15 gatilhos de B** diria quais realmente discriminam e quais só geram ruído (p. ex., `notas_repetidas` em aluguéis mensais legítimos).
- **B tem e A não:** o **dinheiro** (contratos, doações, sanções) e a ligação com pessoas jurídicas. Cruzar com A permite perguntar, por município, se a sobreposição *doador de campanha municipal ↔ contratado pelo mesmo município* (`doador_contratado_municipal`) correlaciona com anomalias eleitorais — pergunta de pesquisa, não acusação.
- **Resolução municipal compartilhada:** o código IBGE de 7 dígitos é a chave comum; o importador `sociolibero humano build` traz agregados do banco do trans (violência, mortes, populações) sem dados pessoais.

## Limites
- Nada aqui detecta fraude de software/hardware da urna (ver `REFERENCES.md`, segurança da urna).
- Gatilhos da família B dependem de qualidade de cadastros (CPF mascarado pela Receita ⇒ vínculo societário por nome normalizado).
- Dados pessoais e alertas nominais **não** são copiados para este repositório.

## Próximas validações sugeridas
1. Portar a validação sintética para os gatilhos de B (injetar ciclos de retroalimentação, fracionamento e concentração em dados simulados e medir TPR/FPR).
2. Cruzamento municipal A×B (agregado, sem nomes): anomalia eleitoral × concentração de contratos × sanções, com controle por tamanho e UF.
3. Calibrar limiares de B com distribuição empírica nacional (como o `rho_z` em A) em vez de cortes fixos.
