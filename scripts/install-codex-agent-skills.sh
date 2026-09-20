#!/usr/bin/env bash
set -euo pipefail

# Optional local Codex enhancement: install Addy Osmani's upstream skill pack.
# Requires Codex CLI v0.122+.
codex plugin marketplace add addyosmani/agent-skills
codex plugin add agent-skills@agent-skills

echo "Installed upstream agent-skills Codex plugin. Start a new Codex session to discover the skills."
