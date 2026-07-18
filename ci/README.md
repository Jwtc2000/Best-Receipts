# CI System

## Division of responsibility

| System | Owns |
|---|---|
| GitHub Actions (`.github/workflows/deploy.yml`) | typecheck, tests, `npm audit` (blocking at `high`), GitHub Pages deploy |
| Jenkins (`Jenkinsfile`) | secrets scanning (`gitleaks`), SAST (`semgrep --config p/default`, metrics off) |

Neither pipeline duplicates the other's stages.

## Windows host operations

```
docker start jenkins jenkins-agent
docker stop jenkins jenkins-agent
```

All state (job config, build history, workspace) persists in the `jenkins_home` and `agent_work` named volumes — stopping/starting the containers does not lose anything. Provisioning details: `ci/blade-setup.ps1`.

## Working rhythm

1. Start containers (`docker start jenkins jenkins-agent`)
2. Push branch, open PR
3. In Jenkins: **Scan Repository Now**
4. Review both required checks on the PR
5. Merge on green
6. Stop containers (`docker stop jenkins jenkins-agent`)

## Branch protection facts

`main` requires a PR plus two status checks, strict mode (branch must be up to date), enforced for admins:

- `test` — GitHub Actions app (`app_id: 15368`)
- `continuous-integration/jenkins/pr-merge` — classic Status API (no app binding)

`build` and `deploy` are **not** required — they `skip` on PRs by design (deploy-only-on-`main`-push gate), and requiring them would deadlock every merge.

## Firewall verification test

- From a non-Tailscale device on the LAN: `http://<blade-lan-ip>:8080` must be **unreachable**.
- From a Tailscale (tailnet) device: it must load.

## Update procedures

- **Jenkins controller**: `docker pull jenkins/jenkins:lts-jdk21`, recreate the `jenkins` container. Volumes preserve all state.
- **Jenkins agent**: on tool bumps (gitleaks/semgrep versions in `ci/agent/Dockerfile`), rebuild the image and recreate the `jenkins-agent` container.
- **GitHub PAT**: rotates at its 90-day expiry.

## Escape hatch

If the Jenkins host is unavailable, temporarily remove `continuous-integration/jenkins/pr-merge` from the required checks in branch protection so GitHub-Actions-only PRs can still merge. Do this deliberately, and revert it once Jenkins is back.

## First-catch note

On its inaugural runs, this pipeline first flagged mutable action tags (`@v4`, `@v5`, etc.) in the Actions workflow as a supply-chain risk, then flagged the missing cooldown period in the Dependabot config added to fix that. Both were remediated: full 40-character commit SHA pins (with the human-readable version kept as a trailing comment) plus a 7-day cooldown in `.github/dependabot.yml`.
