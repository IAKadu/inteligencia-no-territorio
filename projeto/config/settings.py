from pathlib import Path
import yaml

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT.parent / "Dados"
CONFIG_DIR = ROOT / "config"

def load_config() -> dict:
    with open(CONFIG_DIR / "regua_visitas.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)

PARQUETS = {
    "equipes":   DATA_DIR / "equipes_anonimizadas.parquet",
    "pacientes": DATA_DIR / "pacientes_anonimizados.parquet",
    "visitas":   DATA_DIR / "visitas_anonimizadas.parquet",
    "eventos":   DATA_DIR / "eventos_clinicos_anonimizados.parquet",
}
