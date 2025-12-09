# Student Management Centre Report

## Title Page
- **Full Name:** [YOUR_FULL_NAME_ON_MOODLE]
- **Portico ID:** [YOUR_PORTICO_ID]
- **Email:** [YOUR_UCL_EMAIL]
- **Group:** Team 007
- **Repository URL:** https://github.com/ucl-comp0010-2025-classroom/coursework-d-25-t2-s-25-ap1-java_007

> Export this document to A4, single-spaced, 12pt PDF with a separate title page. Keep the main report within three pages.

## Section 1. Technical Description
Our Student Management Centre is a Spring Boot 3 application that exposes REST endpoints for managing students, modules, registrations, grades, and operation history. Controllers map to `/api/*` resources and delegate to services and repositories, keeping HTTP concerns separated from domain logic. Security is enforced by a custom `AuthTokenFilter` that intercepts non-GET requests, validates bearer tokens via `UserService`, and populates the security context when a token matches a stored account, returning an unauthorized response otherwise.【F:src/main/java/uk/ac/ucl/comp0010/config/AuthTokenFilter.java†L1-L55】 The student domain supports CRUD operations, registration to modules, grade recording, and computed statistics such as averages and GPA via dedicated endpoints, ensuring all calculations remain server-side for consistency.【F:src/main/java/uk/ac/ucl/comp0010/controllers/StudentController.java†L1-L93】 Operation history is tracked and can be reverted through an `/api/operations/{id}/revert` endpoint to support recovery from administrative mistakes.【F:src/main/java/uk/ac/ucl/comp0010/controllers/OperationLogController.java†L1-L30】 Persistent state defaults to an in-memory H2 database configured for PostgreSQL compatibility, and interactive API documentation is served through SpringDoc Swagger UI at `/swagger-ui.html` for rapid onboarding.【F:src/main/resources/application.properties†L1-L16】 The frontend is built with Vite, React, and Tailwind CSS under `src/main/resources/static/frontend`, enabling a single-page experience while being bundled for Spring Boot static serving.

My contributions focused on hardening security, expanding student analytics, and adding operational safeguards. I implemented the bearer-token filter to enforce authentication on mutating requests, added GPA and average endpoints to provide consistent grade calculations, and introduced the operation log controller to allow administrators to revert unintended changes. I also maintained documentation for API usage and setup so new teammates can spin up the stack quickly.

## Section 2. Technical Challenges
**Challenge:** Enforcing stateless authentication without disrupting public endpoints.
- **Situation:** Early prototypes allowed unauthenticated mutations because only controller-level annotations guarded routes. This left the API vulnerable to unauthorized writes during integration testing.
- **Task:** Introduce a global check that rejects non-GET traffic without valid tokens while leaving auth and documentation routes accessible.
- **Action:** Added a `OncePerRequestFilter` that short-circuits GET/OPTIONS and `/api/auth` traffic, extracts bearer tokens from headers, and resolves them via `UserService`. When validation fails, it writes an explicit 401 JSON payload instead of letting Spring return HTML errors.【F:src/main/java/uk/ac/ucl/comp0010/config/AuthTokenFilter.java†L17-L55】
- **Result:** Unauthorized POST/PUT/DELETE requests are consistently blocked before hitting controllers, integration tests gained predictable 401 responses, and the team no longer observed accidental data mutations during frontend development.

**Challenge:** Providing reliable academic metrics across registrations.
- **Situation:** GPA and average calculations were initially duplicated in the frontend, leading to rounding drift and missing-edge-case handling when students lacked grades.
- **Task:** Centralize grade analytics on the server so every client displays identical values.
- **Action:** Added dedicated endpoints for averages and GPA within the student controller, delegating computation to the service layer and handling empty-grade scenarios through checked exceptions.
- **Result:** Calculations are now authoritative on the backend, clients share a single source of truth, and API consumers receive structured error responses instead of silent failures.【F:src/main/java/uk/ac/ucl/comp0010/controllers/StudentController.java†L61-L93】

## Section 3. Team Work
We worked in short iterations with backend and frontend owners pairing on API contracts. The most challenging collaboration issue was keeping schemas synchronized while both sides iterated quickly.
- **Situation:** Frequent schema tweaks (e.g., adding GPA outputs) broke the React client and automated API tests.
- **Task:** Establish a predictable workflow for contract changes and rollback paths when regressions occurred.
- **Action:** We agreed to land contract changes behind feature branches, regenerate the OpenAPI spec after every backend merge, and use the operation log reversion endpoint to undo accidental data mutations in shared development databases.【F:src/main/java/uk/ac/ucl/comp0010/controllers/OperationLogController.java†L1-L30】 We also documented curl recipes and expected payloads in the README so everyone could validate new endpoints quickly.
- **Result:** Merge conflicts dropped, frontend breakages were caught earlier, and teammates could restore test data without manual database edits, improving overall velocity.

## Section 4. Retrospective
What went well:
- Centralized authentication and analytics reduced duplicated logic and made the API safer.
- Operation logging and reversion gave us confidence to experiment without fearing data loss.
- Swagger UI and README snippets accelerated onboarding for new contributors.

What to improve next time:
- Introduce automated contract testing (e.g., Pact or Spring REST Docs) so schema drift is caught in CI before merges.
- Add load tests to verify performance when scaling beyond the in-memory H2 profile to production databases.
- Set up linting and formatting for the frontend to match the backend’s enforceable style rules, preventing cosmetic diffs from cluttering PRs.

Planned actions:
- Prototype REST contract tests tied to the Maven build, treating schema changes as breaking unless versioned.
- Add a Postgres-backed profile with data migration scripts to rehearse deployments.
- Integrate frontend linting into the CI pipeline and enforce pre-commit hooks for consistent formatting.
