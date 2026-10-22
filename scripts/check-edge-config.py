#!/usr/bin/env python3
"""Check the production edge policy without Docker daemon, builds or secrets."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parent.parent
apps = ("landing", "admin", "partner", "client", "cashier")
with tempfile.TemporaryDirectory(prefix="loal-edge-config-") as directory:
    infra = Path(directory) / "infra"
    infra.mkdir()
    shutil.copyfile(root / "infra/docker-compose.yml", infra / "docker-compose.yml")
    clean_env = {key: value for key, value in os.environ.items() if key in ("PATH", "HOME", "DOCKER_CONFIG")}
    for override in (None, "http://custom-gateway:8080/_edge/rate-limit"):
        env = dict(clean_env)
        if override:
            env["GATEWAY_RATE_LIMIT_URL"] = override
        result = subprocess.run(["docker", "compose", "config", "--format", "json"],
                                cwd=infra, env=env, capture_output=True, text=True, check=True)
        config = json.loads(result.stdout)
        assert set(config["services"]) == set(apps)
        assert config["networks"]["web"]["external"] is True
        address = override or "http://gateway:8080/_edge/rate-limit"
        assert config["services"]["landing"]["environment"]["GATEWAY_RATE_LIMIT_URL"] == address
        for app in apps:
            service = config["services"][app]
            assert not service.get("ports"), f"{app} must not bypass Traefik via a public port"
            assert "web" in service["networks"]
            labels = service["labels"]
            router = f"traefik.http.routers.loal-{app}"
            assert labels[router + ".entrypoints"] == "websecure"
            chain = labels[router + ".middlewares"].split(",")
            expected = [f"loal-security-{app}@docker", f"loal-ip-{app}@docker"]
            if app == "landing":
                expected += ["loal-www-to-apex@docker"]
            assert chain == expected, f"{app}: check IP before redirecting or serving content"
            guard = f"traefik.http.middlewares.loal-ip-{app}.forwardauth."
            assert labels[guard + "address"] == address
            assert labels[guard + "trustForwardHeader"] == "false"
            assert labels[guard + "authRequestHeaders"] == "Origin", "Do not send cookies/tokens to the IP check"
            assert labels[guard + "forwardBody"] == "false"
            assert labels[guard + "maxResponseBodySize"] == "16384"
            assert labels[guard + "preserveRequestMethod"] == "false"
            assert labels[router + ".rule"].startswith("Host("), "No path exclusion may bypass the guard"

for name in (".github/workflows/cd.yml", "scripts/ship.sh"):
    source = (root / name).read_text()
    assert source.index("bash scripts/check-edge-ready.sh") < source.index(
        "docker compose -f infra/docker-compose.yml up -d"), f"{name}: probe the gateway before rollout"
probe = (root / "scripts/check-edge-ready.sh").read_text()
assert "--label traefik.enable=false" in probe, "The deployment probe must never receive public traffic"
print("Edge checks passed: all five sites, shared quota, trusted IP source, no public bypass, deployment readiness")
