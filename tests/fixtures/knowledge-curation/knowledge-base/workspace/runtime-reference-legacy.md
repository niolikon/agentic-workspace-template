# TaskBoard runtime reference — legacy monolithic note

This document accumulated multiple workspace concerns over time. Its contents are evidence-backed, but the document has become difficult to navigate and overlaps several canonical workspace documents.
## 1. Primary runtime selection

- The orchestrated deployment treats `TaskBoard.Service.Boot` as the primary backend implementation.
- `TaskBoard.Service.Core` remains documented as an alternate or standalone .NET implementation.
- Evidence: `repositories/TaskBoard.Zone.Boot/.gitmodules` and `repositories/TaskBoard.Zone.Boot/docker-compose.yml`.
- Confidence: High.

### Curation note

This section belongs to a distinct concern already represented elsewhere in the knowledge base. During curation, preserve its evidence and confidence while deciding whether the monolithic document should be split, merged into canonical documents, or replaced by navigation links.

## 2. Orchestration

- `TaskBoard.Zone.Boot` composes the local platform with Docker Compose and repository submodules.
- The composition includes backend services, Keycloak, APISIX and supporting storage/database infrastructure.
- Evidence: `repositories/TaskBoard.Zone.Boot/docker-compose.yml`, `repositories/TaskBoard.Zone.Boot/.gitmodules`, and `repositories/TaskBoard.Zone.Boot/config/*`.
- Confidence: High for composition-level structure.

### Curation note

This section belongs to a distinct concern already represented elsewhere in the knowledge base. During curation, preserve its evidence and confidence while deciding whether the monolithic document should be split, merged into canonical documents, or replaced by navigation links.

## 3. Frontend to backend flow

- User Todo operations originate in the Angular frontend and are sent over HTTP to the primary Java backend in the orchestrated environment.
- The backend persists Todo state and returns DTO responses to the frontend.
- Evidence: `repositories/TaskBoard.App.Ng/package.json`, `repositories/TaskBoard.Zone.Boot/README.md`, `repositories/TaskBoard.Zone.Boot/.env`, and the orchestrator composition.
- Confidence: High for the primary orchestrated flow.

### Curation note

This section belongs to a distinct concern already represented elsewhere in the knowledge base. During curation, preserve its evidence and confidence while deciding whether the monolithic document should be split, merged into canonical documents, or replaced by navigation links.

## 4. Authentication

- Keycloak acts as the identity provider in the composed environment.
- Backend services are configured to validate OAuth2 resource-server tokens.
- Evidence: `repositories/TaskBoard.Zone.Boot/config/keycloak/realm-export.json` and service security configuration referenced by existing workspace knowledge.
- Confidence: High for Keycloak presence; exact client/scope mapping may require runtime configuration confirmation.

### Curation note

This section belongs to a distinct concern already represented elsewhere in the knowledge base. During curation, preserve its evidence and confidence while deciding whether the monolithic document should be split, merged into canonical documents, or replaced by navigation links.

## 5. Gateway

- APISIX configuration is present in the orchestrator and represents the workspace gateway/reverse-proxy layer.
- Gateway routing is a workspace-level concern because it sits between clients and backend services.
- Evidence: `repositories/TaskBoard.Zone.Boot/config/apisix`.
- Confidence: Medium-High for gateway role; exact runtime routes depend on configuration.

### Curation note

This section belongs to a distinct concern already represented elsewhere in the knowledge base. During curation, preserve its evidence and confidence while deciding whether the monolithic document should be split, merged into canonical documents, or replaced by navigation links.

## 6. Polyglot architecture

- The workspace combines Java/Spring Boot, .NET/C#/EF Core, and Angular/TypeScript technologies.
- This is a compositional multi-technology workspace rather than a single-language application.
- Evidence: repository manifests and source layouts referenced from repository overviews.
- Confidence: High.

### Curation note

This section belongs to a distinct concern already represented elsewhere in the knowledge base. During curation, preserve its evidence and confidence while deciding whether the monolithic document should be split, merged into canonical documents, or replaced by navigation links.

## 7. Repository relationships

- `TaskBoard.Service.Boot` declares a compile-time Maven dependency on `TaskBoard.Framework.Boot`.
- `TaskBoard.Zone.Boot` provides runtime composition through Docker Compose and Git submodules.
- Evidence: `repositories/TaskBoard.Service.Boot/pom.xml`, `repositories/TaskBoard.Zone.Boot/.gitmodules`, and `repositories/TaskBoard.Zone.Boot/docker-compose.yml`.
- Confidence: High for the explicit relationships.

### Curation note

This section belongs to a distinct concern already represented elsewhere in the knowledge base. During curation, preserve its evidence and confidence while deciding whether the monolithic document should be split, merged into canonical documents, or replaced by navigation links.

## 8. Open questions

- No explicit messaging configuration was identified in the existing workspace knowledge.
- Where only one side of a runtime integration is explicit, the relationship remains probable rather than confirmed.
- These uncertainties must be preserved rather than converted into stronger claims during curation.
- Confidence: intentionally unresolved where noted.

### Curation note

This section belongs to a distinct concern already represented elsewhere in the knowledge base. During curation, preserve its evidence and confidence while deciding whether the monolithic document should be split, merged into canonical documents, or replaced by navigation links.
## 9. Navigation appendix

The same workspace concerns can currently be discovered in separate documents:

- `architecture.md` — workspace architecture and patterns.
- `orchestration.md` — deployment composition.
- `execution-flows.md` — cross-repository runtime flows.
- `data-flows.md` — cross-repository data movement.
- `repository-relationships.md` — compile-time/runtime repository relationships.
- `decision-primary-backend.md` — decision selecting the Java backend as primary.

This appendix intentionally demonstrates that the monolithic note has become an unnecessary second navigation surface. A curator should avoid keeping duplicate prose merely because it is evidence-backed; evidence-backed facts may be consolidated into canonical documents and linked instead, as long as no evidence or nuance is discarded.

## 10. Evidence preservation appendix

Evidence references appearing in this document must not be followed into source repositories during ordinary curation. They are metadata to preserve. If content is consolidated into other documents, the relevant evidence paths, confidence levels, and unresolved qualifications must survive the operation.
