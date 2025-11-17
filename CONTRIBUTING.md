# Contributing

Thanks for your interest in contributing! The following guidelines help keep the project stable and easy to maintain.

Workflow

1. Open an issue first for substantial or breaking changes to get feedback from maintainers.
2. Create a branch for each change (e.g., `fix/runtime-typing`, `feat/logger-adapter`).
3. Keep changes small and atomic — one logical change per PR.
4. Add or update tests for behavior you change.
5. If your change affects the public API, document it clearly (CHANGELOG) and discuss versioning.
6. Open a Pull Request with a clear description, rationale, and testing instructions.

Code style and expectations

- Use TypeScript with `strict` mode enabled. Prefer `unknown` over `any` and perform explicit narrowing/casts when necessary.
- Keep public exports stable: avoid renaming/removing exported functions without prior discussion.
- Write clear, concise commit messages (short summary + explanation why).

PR checklist

- [ ] Branch name follows pattern and describes intent.
- [ ] Tests added or updated where relevant.
- [ ] Linted / code formatted (if linting/formatting is configured).
- [ ] Changes described in PR body and linked to any related issue.
- [ ] If public API changed, document it and include a migration note.

If you're unsure about implementation details or the scope of a change, open an issue or ask in the PR comments — maintainers will help.
