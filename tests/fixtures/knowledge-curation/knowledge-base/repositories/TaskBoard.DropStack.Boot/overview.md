# TaskBoard.DropStack.Boot — overview

Repository path: repositories/TaskBoard.DropStack.Boot

Purpose

Auxiliary deployment stack components: storage bootstrap scripts, MinIO, DB initialization scripts and other infra helpers used by the orchestrator.

Role

- Deployment support / infrastructure bootstrap for the composed environment.

Technology and build system

- Java / Maven (submodule checkout contains a Maven project) and shell scripts for provisioning.

Primary evidence

- `repositories/TaskBoard.Zone.Boot/TaskBoard.DropStack.Boot/docker-compose.yml` and `config/*` (initdb scripts, minio bootstrap)

Status

- Recognised as part of the orchestrated deployment. No application-level execution flows documented here beyond provisioning scripts.
