#Requires -RunAsAdministrator
<#
  Manual provisioning script for the Jenkins controller + firewall lockdown
  on the Windows blade. Review and run this yourself in an elevated
  PowerShell — it is not executed by Claude Code.

  Design: Jenkins publishes 8080 on all host interfaces (-p 8080:8080).
  Reachability is restricted at the Windows Firewall layer, not the Docker
  layer, via an Allow rule scoped to the Tailscale CGNAT range
  (100.64.0.0/10) plus an explicit Block rule for everything else.

  NOTE on rule precedence: Windows Firewall always lets an Allow rule lose
  to a Block rule when both match the same traffic ("Block" has priority
  over "Allow" regardless of creation order or specificity). To avoid the
  Block rule silently swallowing the Allow rule, the Block rule below is
  scoped to the literal complement of 100.64.0.0/10 rather than "Any":
    - 0.0.0.0       - 100.63.255.255
    - 100.128.0.0   - 255.255.255.255
  This keeps the two rules non-overlapping so both take effect as intended.
#>

$ErrorActionPreference = 'Stop'

$TailscaleRange   = '100.64.0.0/10'
$NonTailscaleLow  = '0.0.0.0-100.63.255.255'
$NonTailscaleHigh = '100.128.0.0-255.255.255.255'
$AllowRuleName    = 'Jenkins-8080-Allow-Tailscale'
$BlockRuleName    = 'Jenkins-8080-Block-Other'

# --- (1) Create the Docker network -----------------------------------------
Write-Host "[1/6] Creating docker network 'jenkins'..." -ForegroundColor Cyan
docker network create jenkins

# --- (2) Run the Jenkins controller -----------------------------------------
Write-Host "[2/6] Starting Jenkins controller container 'jenkins' (jenkins/jenkins:lts-jdk17)..." -ForegroundColor Cyan
docker run -d `
    --name jenkins `
    --restart no `
    --network jenkins `
    -p 8080:8080 `
    -v jenkins_home:/var/jenkins_home `
    jenkins/jenkins:lts-jdk17

# --- (3) Windows Firewall rules ---------------------------------------------
Write-Host "[3/6] Configuring Windows Firewall for TCP 8080..." -ForegroundColor Cyan

Write-Host "      Removing any pre-existing rules with the same names (idempotency)..."
Remove-NetFirewallRule -DisplayName $AllowRuleName -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName $BlockRuleName -ErrorAction SilentlyContinue

Write-Host "      Adding Allow rule: TCP 8080 from $TailscaleRange (Tailscale) only..."
New-NetFirewallRule `
    -DisplayName $AllowRuleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 8080 `
    -RemoteAddress $TailscaleRange `
    -Profile Any | Out-Null

Write-Host "      Adding Block rule: TCP 8080 from everything outside $TailscaleRange..."
New-NetFirewallRule `
    -DisplayName $BlockRuleName `
    -Direction Inbound `
    -Action Block `
    -Protocol TCP `
    -LocalPort 8080 `
    -RemoteAddress $NonTailscaleLow, $NonTailscaleHigh `
    -Profile Any | Out-Null

# --- (4) Print the initial admin password -----------------------------------
Write-Host "[4/6] Waiting for Jenkins to generate its initial admin password..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    docker exec jenkins test -f /var/jenkins_home/secrets/initialAdminPassword 2>$null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 2
}

if ($ready) {
    Write-Host "      Initial admin password:" -ForegroundColor Green
    docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
} else {
    Write-Host "      Timed out waiting for the password file. Check 'docker logs jenkins'." -ForegroundColor Red
}

# --- (5) TODO: remaining manual steps ---------------------------------------
Write-Host "[5/6] Manual steps still required:" -ForegroundColor Yellow
Write-Host @"

  TODO 1 - Browser setup wizard:
    Visit http://localhost:8080 (or the blade's Tailscale IP) from a
    Tailscale-connected machine, paste the initial admin password above,
    and complete the Jenkins setup wizard (install suggested plugins,
    create your admin user).

  TODO 2 - Build the agent image (run from the repo root):
    docker build -t jenkins-agent-sec ci/agent/

  TODO 3 - Register 'agent1' in Jenkins:
    In Manage Jenkins > Nodes, create a permanent agent named 'agent1'
    (matches the Jenkinsfile's `agent { label 'agent1' }`), launch method
    "Launch agent by connecting it to the controller", and copy the
    generated <SECRET> it gives you.

  TODO 4 - Run the agent container with that secret:
    docker run -d ``
        --network jenkins ``
        -v agent_work:/home/jenkins/agent ``
        --init ``
        --restart no ``
        jenkins-agent-sec ``
        -url http://jenkins:8080 ``
        -workDir /home/jenkins/agent ``
        -secret <SECRET> ``
        -name agent1

    Notes:
      - No published ports on the agent container.
      - Do NOT mount the Docker socket (no -v /var/run/docker.sock:...).
        The agent does not need it and it would be a container-escape
        risk for anything running the security-scan stages.

"@

# --- (6) Verification reminder ----------------------------------------------
Write-Host "[6/6] Verification checklist:" -ForegroundColor Yellow
Write-Host @"

  - From a device on your LAN that is NOT on your Tailscale network:
      http://<blade-lan-ip>:8080  must be UNREACHABLE.

  - From your Mac, over Tailscale:
      http://<blade-tailscale-ip>:8080  must load the Jenkins UI.

  If either check fails, re-verify the firewall rules with:
      Get-NetFirewallRule -DisplayName 'Jenkins-8080-*' | Format-Table
      Get-NetFirewallRule -DisplayName 'Jenkins-8080-*' | Get-NetFirewallAddressFilter

"@
