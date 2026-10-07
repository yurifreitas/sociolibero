from __future__ import annotations

from pathlib import Path


def main() -> None:
    import sys

    if len(sys.argv) > 1 and sys.argv[1] in (
        "sens",
        "calibrate",
        "decisoes",
        "eleicoes",
        "territorios",
        "series",
        "humano",
        "futuros",
        "clima",
        "corrupcao",
        "quebras",
        "climars",
        "evolucoes",
        "pessimismo",
        "indigenas",
        "eleitorado",
    ):
        return _diag(sys.argv[1])

    from . import scenarios

    sys.stdout.reconfigure(encoding="utf-8")

    out = Path("out")
    out.mkdir(exist_ok=True)
    r = scenarios.run()
    r["table"].to_csv(out / "trajetorias.csv", index=False)

    print(f"Base macro: {r['macro_base']}")
    print(f"P(Flávio vence 2º turno, suposição de transferência): {r['p_flavio']:.1%}")
    print("Pesos:", {k: f"{v:.1%}" for k, v in r["weights"].items()})
    print("Aprovação no Senado por indicado:", r["senate_approval"])
    print(
        "P(dívida > 120% do PIB em algum ano = ruptura de regime):",
        {k: f"{v:.0%}" for k, v in r["breach"].items()},
    )
    t = r["table"]
    for var, unit in (
        ("debt", "% PIB"),
        ("selic", "% a.a."),
        ("ipca", "%"),
        ("gdp", "% a.a."),
    ):
        print(f"\n{var} ({unit}) — mediana [p10–p90] em 2030 e 2038")
        for sc in t.scenario.unique():
            s = t[(t.scenario == sc) & (t["var"] == var)]
            cell = lambda y: (
                f"{s[(s.year == y) & (s.q == 50)].value.iat[0]:6.1f} [{s[(s.year == y) & (s.q == 10)].value.iat[0]:.1f}–{s[(s.year == y) & (s.q == 90)].value.iat[0]:.1f}]"
            )
            print(f"  {sc:<11} 2030 {cell(2030)}   2038 {cell(2038)}")


def _diag(cmd: str) -> None:
    import json
    import sys

    sys.stdout.reconfigure(encoding="utf-8")
    if cmd == "sens":
        from .sensitivity import tornado

        df = tornado()
        Path("out").mkdir(exist_ok=True)
        df.to_csv("out/sensibilidade.csv", index=False)
        for sc, g in df.groupby("scenario"):
            print(f"\n{sc}: dívida/PIB 2035 (ref {g.ref.iat[0]:.0f}%) — maiores swings")
            for _, r in g.head(6).iterrows():
                print(
                    f"  {r.fator:<28} {r.dívida_lo:6.0f} … {r.dívida_hi:6.0f}  (Δ {r.swing:.0f}pp)"
                )
    elif cmd == "eleicoes":
        from .eleicoes import build

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub == "baixar":
            from .eleicoes import ingest

            for n in ingest.FONTES:
                print(n, ingest.baixar(n)["sha256"][:12])
        else:
            print(
                json.dumps(build.build(), ensure_ascii=False, indent=1, default=str)[
                    :6000
                ]
            )
    elif cmd == "territorios":
        from . import territorios

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub == "baixar":
            for n, m in territorios.baixar_tudo().items():
                print(n, m["sha256"][:12])
        else:
            r = territorios.build()
            print(
                json.dumps(r["meta"]["validacao"], ensure_ascii=False, indent=1)[:6000]
            )
    elif cmd == "humano":
        from . import humano

        args = sys.argv[2:]
        sub = args[0] if args and not args[0].startswith("-") else "build"
        db = None
        if "--db" in args:
            k = args.index("--db")
            db = args[k + 1] if k + 1 < len(args) else None
        if sub != "build":
            raise SystemExit("uso: sociolibero humano build [--db <trans.db>]")
        r = humano.build(db)
        v = r["municipal"]["meta"]["validacao"]
        print(
            json.dumps(
                {
                    k: v[k]
                    for k in ("homicidios_nacional_por_ano", "homicidios_vs_publicado")
                },
                ensure_ascii=False,
                indent=1,
            )[:6000]
        )
    elif cmd == "futuros":
        from . import tecnologia

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub == "baixar":
            for n, m in tecnologia.baixar_tudo().items():
                print(n, m["sha256"][:12])
        else:
            r = tecnologia.build()
            for c in r["curvas"]:
                e = (c.get("ajuste") or {}).get("erro_teste")
                b = (c.get("ajuste") or {}).get("baseline_erro_teste")
                print(
                    f"{c['id']:<28} {c['modelo']:<11} teste MAPE "
                    + (
                        f"{e['mape_pct']:.1f}% (ingênuo {b['ingenuo']['mape_pct']:.1f}%, linear {b['linear']['mape_pct']:.1f}%)"
                        if e
                        else "n/d"
                    )
                )
            print(
                "macro:",
                json.dumps(
                    r["integracao_macro"]["resultados_2035"]["base"]["2035"],
                    ensure_ascii=False,
                )[:600],
            )
    elif cmd == "series":
        from .series import build, ingest

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub == "baixar":
            for n, m in ingest.baixar_tudo().items():
                print(n, m["sha256"][:12])
        else:
            r = build.build()
            print(
                json.dumps(r["meta"]["validacao"], ensure_ascii=False, indent=1)[:6000]
            )
    elif cmd == "clima":
        from .clima import build, ingest

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub == "baixar":
            for n, m in ingest.baixar_tudo().items():
                print(n, m["sha256"][:12])
        else:
            r = build.build()
            print(json.dumps(r["resumo"], ensure_ascii=False, indent=1)[:6000])
    elif cmd == "corrupcao":
        from . import corrupcao

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub != "build":
            raise SystemExit("uso: sociolibero corrupcao build")
        r = corrupcao.build()
        print(json.dumps(r["meta"]["resumo"], ensure_ascii=False, indent=1))
        for c in r["recuperacao_macro"]["cenarios"]:
            print(c)
    elif cmd == "quebras":
        from . import quebras

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub != "build":
            raise SystemExit("uso: sociolibero quebras build [--rapido] [--reusar]")
        r = quebras.build(
            quick="--rapido" in sys.argv, reusar_validacao="--reusar" in sys.argv
        )
        print("procedimento:", r["validacao"]["procedimento_final"]["escolhido"])
        print("controle metodológico:", r["meta"]["metodo"]["controle_metodologico"])
        for sr in r["series"]:
            print(
                f"{sr['id']:<36} n={sr['n']:<4} {sr['modo']:<9}",
                [
                    (b["ano"], b["tipo"], b["artefato_metodologico"])
                    for b in sr["quebras"]
                ],
            )
        print("cruzamento com a história:", r["cruzamento_historia"])
    elif cmd == "climars":
        from . import climars

        args = sys.argv[2:]
        sub = args[0] if args and not args[0].startswith("-") else "build"
        if sub != "build":
            raise SystemExit(
                "uso: sociolibero climars build [--snapshot <dir>] [--out <json>]"
            )
        kw = {}
        for flag, key in (("--snapshot", "snapshot"), ("--out", "out")):
            if flag in args:
                k = args.index(flag)
                kw[key] = Path(args[k + 1]) if k + 1 < len(args) else None
        r = climars.build(**kw)
        v = r["meta"]["validacao"]
        print(
            json.dumps(
                {k: v[k] for k in v if k != "nomes_diferentes_snapshot_vs_geojson"},
                ensure_ascii=False,
                indent=1,
            )[:6000]
        )
    elif cmd == "evolucoes":
        from . import markov

        args = sys.argv[2:]
        sub = args[0] if args and not args[0].startswith("-") else "build"
        if sub == "baixar":
            for n, m in markov.baixar().items():
                print(n, m["sha256"][:12])
        elif sub == "build":
            r = markov.build(rapido="--rapido" in args)
            print("escrito:", markov.OUT)
            pb = r["regimes_politicos"]["projecao_brasil"]
            print("Brasil 2025:", pb["estado_inicial"]["rotulo"])
            print(
                "P(democracia eleitoral) 2038 p10/p50/p90:",
                pb["p10"][-1][2],
                pb["p50"][-1][2],
                pb["p90"][-1][2],
            )
            print("ocupação por ciclo:", r["cadeia_cenarios"]["ocupacao"]["por_ciclo"])
        else:
            raise SystemExit("uso: sociolibero evolucoes [baixar|build [--rapido]]")
    elif cmd == "pessimismo":
        from . import pessimismo

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub != "build":
            raise SystemExit("uso: sociolibero pessimismo build [--rapido]")
        r = pessimismo.build(rapido="--rapido" in sys.argv)
        print(r["meta"]["aviso"].upper(), "| escrito:", pessimismo.SAIDA)
        v = r["validacao"]
        print("regressão ok:", v["regressao"]["eficiencia_1_igual_ao_catalogo"])
        print("violações de monotonicidade:", len(v["monotonicidade"]["violacoes"]))
        for k, x in r["cenario_adverso"]["prob_ruptura"].items():
            print(f"P(ruptura) {k}: {x}")
        print(
            "top fragilidade:",
            [x["id"] for x in r["eficiencia_de_execucao"]["ranking_fragilidade"][:5]],
        )
    elif cmd == "indigenas":
        from . import indigenas

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub != "build":
            raise SystemExit("uso: sociolibero indigenas build")
        r = indigenas.build()
        for a, v in r["candidaturas"]["anos"].items():
            print(
                a,
                v["indigenas"],
                "candidaturas,",
                v["eleitos"],
                "eleitos,",
                v["pct"],
                "%",
            )
        print("escrito:", indigenas.SAIDA)
    elif cmd == "eleitorado":
        from . import eleitorado

        sub = sys.argv[2] if len(sys.argv) > 2 else "build"
        if sub == "baixar":
            for n, m in eleitorado.baixar_tudo().items():
                print(n, m["sha256"][:12])
        elif sub == "build":
            r = eleitorado.build()
            for a, d in r["eleitorado_por_instrucao"].items():
                n = d["nacional"]
                print(
                    a,
                    n["total"],
                    "eleitores,",
                    n["por_grupo"]["analfabeto"],
                    "analfabetos",
                )
            print("escrito:", eleitorado.SAIDA, "e", eleitorado.SAIDA_MUN)
        else:
            raise SystemExit("uso: sociolibero eleitorado [baixar|build]")
    elif cmd == "decisoes":
        from .decisoes import export

        r = export()
        print("2035 referência (pragmático):", r["meta"]["referencia_2035"])
        print(f"{'decisão':<62}{'P dir':>6}{'P esq':>6}{'Δdívida':>9}{'ΔSelic':>8}")
        for d in sorted(r["decisoes"], key=lambda x: -abs(x["impacto_2035"]["debt"])):
            pa, im = d["p_aprovacao"], d["impacto_2035"]
            print(
                f"{d['rotulo'][:60]:<62}{pa['direita']:>6.0%}{pa['esquerda']:>6.0%}{im['debt']:>9.1f}{im['selic']:>8.1f}"
            )
    else:
        from .calibrate import report

        for k, v in report()["report"].items():
            print(
                k,
                {
                    a: {c: round(d, 2) for c, d in b.items()}
                    for a, b in v.items()
                    if a != "params"
                },
            )
