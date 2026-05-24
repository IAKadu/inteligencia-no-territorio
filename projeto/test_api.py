import sys
sys.path.insert(0, ".")

from api.main import app
from fastapi.testclient import TestClient

with TestClient(app) as client:
    r = client.get("/")
    print("GET /:", r.status_code, r.json()["pacientes_carregados"], "pacientes")

    equipes = client.get("/equipes").json()
    eid = equipes["equipes"][0]
    print(f"Equipes: {equipes['total']}")

    agenda = client.get(f"/equipes/{eid}/agenda?com_justificativas=false").json()
    print(f"Agenda equipe {eid[-8:]}: {len(agenda)} visitas")
    print("  Scores:", [v["score_total"] for v in agenda])
    print("  Prioridades:", [v["prioridade"] for v in agenda])

    agenda_6acs = client.get(f"/equipes/{eid}/agenda?capacidade=36&com_justificativas=false")
    print(f"Agenda 6 ACS x 6 visitas: HTTP {agenda_6acs.status_code} | {len(agenda_6acs.json())} visitas")
    assert agenda_6acs.status_code == 200

    painel = client.get("/gestao/painel").json()
    print(f"Painel: {len(painel)} equipes | top pressao={painel[0]['score_pressao']}")

    inv = client.get("/gestao/invisiveis").json()
    print(f"Invisiveis: total={inv['total']} | por_cat={inv['por_categoria']}")

    inv_eq = client.get(f"/equipes/{eid}/invisiveis?categoria=1").json()
    print(f"Crise sem vinculo na equipe {eid[-8:]}: {inv_eq['total']}")
