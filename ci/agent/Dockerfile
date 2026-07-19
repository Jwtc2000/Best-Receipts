# jenkins/inbound-agent, pinned to the current recommended build
# (Debian-based; equivalent to the "latest"/"latest-jdk21" floating tags
# as of 2026-07-18). Debian base is used instead of Alpine because semgrep's
# PyPI wheels target glibc, not musl.
#
# Each scan tool below gets its own RUN layer rather than being merged
# together: bumping one tool's ARG only invalidates and re-downloads that
# tool's layer on rebuild, not every tool's.
FROM jenkins/inbound-agent:3383.vc8881d4b_0e76-1-jdk21
USER root
ARG GITLEAKS_VERSION=8.30.1
ARG SEMGREP_VERSION=1.170.0
ARG ZIZMOR_VERSION=1.27.0
ARG OSV_SCANNER_VERSION=2.4.0
ARG HADOLINT_VERSION=2.14.0
ARG SYFT_VERSION=1.48.0
# Intentionally unpinned: apt version pinning on Debian is brittle across
# mirror/snapshot lifecycle (a pinned version can vanish from the mirror
# before the next rebuild, breaking the build over a transitive tool
# dependency rather than an actual security concern). git/curl/python3-pip
# are base-layer plumbing, not security-sensitive scan tools — those are
# all pinned individually below by their own ARGs.
# hadolint ignore=DL3008
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
RUN pip3 install --no-cache-dir --break-system-packages "semgrep==${SEMGREP_VERSION}"
# Workflow security auditor
# hadolint ignore=DL3059
RUN pip3 install --no-cache-dir --break-system-packages "zizmor==${ZIZMOR_VERSION}"
# Supply-chain vulnerability scanner (OSV database).
# Note: v2.x release assets are named osv-scanner_linux_amd64 with the
# version only in the tag path (v1.x embedded the version in the filename).
RUN curl -fsSL -o /usr/local/bin/osv-scanner \
        "https://github.com/google/osv-scanner/releases/download/v${OSV_SCANNER_VERSION}/osv-scanner_linux_amd64" \
    && chmod +x /usr/local/bin/osv-scanner \
    && osv-scanner --version
# Dockerfile linter, used against ci/agent/Dockerfile itself.
RUN curl -fsSL -o /usr/local/bin/hadolint \
        "https://github.com/hadolint/hadolint/releases/download/v${HADOLINT_VERSION}/hadolint-linux-x86_64" \
    && chmod +x /usr/local/bin/hadolint \
    && hadolint --version
# SBOM generator, run on main to produce sbom.json as a build artifact.
RUN curl -fsSL -o /tmp/syft.tar.gz \
        "https://github.com/anchore/syft/releases/download/v${SYFT_VERSION}/syft_${SYFT_VERSION}_linux_amd64.tar.gz" \
    && tar -xzf /tmp/syft.tar.gz -C /usr/local/bin syft \
    && rm /tmp/syft.tar.gz \
    && syft version

USER jenkins