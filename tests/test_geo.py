from sociolibero.eleicoes import geo


def test_norm_strips_accents_and_punctuation():
    assert geo.norm("Santa Bárbara d'Oeste") == "SANTA BARBARA D OESTE"
    assert geo.norm("SÃO LUÍS") == "SAO LUIS"


def test_tse_to_ibge_uses_aliases_and_reports_misses():
    index = {("SP", "SAO LUIZ DO PARAITINGA"): "3550001"}
    ok, miss = geo.tse_to_ibge(
        [(1, "SP", "SÃO LUÍS DO PARAITINGA"), (2, "MT", "BOA ESPERANÇA DO NORTE")],
        index,
    )
    assert ok == {1: "3550001"}
    assert [m["cd_tse"] for m in miss] == [2]
