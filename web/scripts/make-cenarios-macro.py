"""Gera web/public/data/cenarios_macro.json: p10/p50/p90 por cenário e ano (scenarios.run), para o editor 'e se?' da página História.
Uso (na raiz do repo): uv run python web/scripts/make-cenarios-macro.py
Não inventa número: lê scenarios.run(seed=7, n=2000), a mesma fonte de evolucoes.json."""
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
from sociolibero import scenarios  # noqa: E402

r = scenarios.run(seed=7, n=2000)
t = r["table"]
out = {
    "meta": {
        "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
        "fonte": "sociolibero.scenarios.run(seed=7, n=2000); base macro " + str(r["macro_base"].source),
        "aviso": "Trajetórias por cenário (cada uma com a sua própria incerteza); acima de 120% de dívida/PIB é ruptura de regime, não trajetória. Julgamentos do cenário (alavancas) estão em scenarios.py.",
        "pesos_estaticos": {k: round(float(v), 4) for k, v in r["weights"].items()},
        "unidades": {"debt": "% PIB (bruta)", "selic": "% a.a.", "ipca": "%", "gdp": "% a.a."},
    },
    "anos": sorted({int(y) for y in t.year.unique()}),
    "cenarios": {},
    "mix_scenarios_run": {},
}
for sc in t.scenario.unique():
    block = {}
    for var in ("debt", "selic", "ipca", "gdp"):
        s = t[(t.scenario == sc) & (t["var"] == var)]
        block[var] = {f"p{q}": [float(s[(s.q == q) & (s.year == y)].value.iat[0]) for y in out["anos"]] for q in (10, 50, 90)}
    (out["mix_scenarios_run"] if sc == "mix" else out["cenarios"])[sc] = block
out["breach"] = {k: round(float(v), 4) for k, v in r["breach"].items()}
Path("web/public/data/cenarios_macro.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", list(out["cenarios"]), out["anos"][0], out["anos"][-1])
# conferência com evolucoes.json (mistura estática publicada pelo agente de Markov)
ev = json.loads(Path("web/public/data/evolucoes.json").read_text(encoding="utf-8"))
ref = ev["cadeia_cenarios"]["macro_esperada"]["estatica_scenarios_run"]["macro"]["debt"]
mine = out["mix_scenarios_run"]["mix"]["debt"]["p50"]
print("p50 debt 2038: evolucoes", ref["p50"][-1], "| scenarios.run mix", round(mine[-1], 2))
