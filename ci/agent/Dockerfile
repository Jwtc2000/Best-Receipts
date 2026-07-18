# jenkins/inbound-agent, pinned to the current recommended build
# (Debian-based; equivalent to the "latest"/"latest-jdk21" floating tags
# as of 2026-07-18). Debian base is used instead of Alpine because semgrep's
# PyPI wheels target glibc, not musl.
FROM jenkins/inbound-agent:3383.vc8881d4b_0e76-1-jdk21

USER root

ARG GITLEAKS_VERSION=8.30.1

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

USER jenkins
