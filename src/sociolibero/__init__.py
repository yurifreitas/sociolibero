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
            import json

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
            import json

            r = territorios.build()
            print(
                json.dumps(r["meta"]["validacao"], ensure_ascii=False, indent=1)[:6000]
            )
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
