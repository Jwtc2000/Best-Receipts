# jenkins/inbound-agent, pinned to the current recommended build
# (Debian-based; equivalent to the "latest"/"latest-jdk21" floating tags
# as of 2026-07-18). Debian base is used instead of Alpine because semgrep's
# PyPI wheels target glibc, not musl.
FROM jenkins/inbound-agent:3383.vc8881d4b_0e76-1-jdk21
USER root
ARG GITLEAKS_VERSION=8.30.1
ARG ZIZMOR_VERSION=1.27.0
ARG OSV_SCANNER_VERSION=2.3.8
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        python3-pip \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -o /tmp/gitleaks.tar.gz \
        "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    && tar -xzf /tmp/gitleaks.tar.gz -C /usr/local/bin gitleaks \
    && rm /tmp/gitleaks.tar.gz \
    && gitleaks version
RUN pip3 install --no-cache-dir --break-system-packages semgrep
# Workflow security auditor
RUN pip3 install --no-cache-dir --break-system-packages "zizmor==${ZIZMOR_VERSION}"
# Supply-chain vulnerability scanner (OSV database).
# Note: v2.x release assets are named osv-scanner_linux_amd64 with the
# version only in the tag path (v1.x embedded the version in the filename).
RUN curl -fsSL -o /usr/local/bin/osv-scanner \
        "https://github.com/google/osv-scanner/releases/download/v${OSV_SCANNER_VERSION}/osv-scanner_linux_amd64" \
    && chmod +x /usr/local/bin/osv-scanner \
    && osv-scanner --version

USER jenkins