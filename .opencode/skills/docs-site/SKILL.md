---
name: docs-site
description: "Use when creating or restructuring a documentation site — choosing a generator (Starlight, Docusaurus, VitePress, MkDocs Material), Diátaxis information architecture, navigation, versioned docs, search, tested code samples, link checking, and preview deploys."
license: MIT
---

# Documentation Sites

## When to Use This Skill
- Library, API, or product docs outgrow a README
- Users can't find things in existing docs
- Docs drift from code because they live elsewhere

## Choosing a generator
| Tool | Good for |
|------|----------|
| Starlight (Astro) | Fast static docs, MD/MDX, built-in search and i18n |
| Docusaurus | React ecosystem, versioned docs, blog, plugins |
| VitePress | Vue/Vite projects, minimal config |
| MkDocs Material | Python projects, Markdown-only teams, rich theme |

## Information architecture (Diátaxis)
- **Tutorials** — learning-oriented; a guided first success.
- **How-to guides** — task-oriented; "How to rotate API keys".
- **Reference** — information-oriented; complete, generated where possible (API, CLI, config).
- **Explanation** — understanding-oriented; concepts, architecture, trade-offs.

Keep each page in one mode. Mixing tutorial and reference is the most common cause of confusing docs.

## Structure
```
docs/
  getting-started/   installation.md, quickstart.md
  guides/            deploy.md, auth.md
  reference/         cli.md, config.md, api/ (generated)
  concepts/          architecture.md
```
- Sidebar mirrors user goals, not code modules.
- Landing page: what it is, quickstart link, top tasks.

## Docs as code
- Docs live in the same repo; doc changes ship with code changes.
- CI: build, link-check (`lychee`), lint prose (`vale`), spell-check.
- Preview deploys on every PR.
- Test code samples: extract from tested files (snippet includes) or run doctests.

## Versioning and search
- Version docs only for major lines users actually run; label the default clearly.
- Built-in search (Pagefind, local search) for small sites; Algolia DocSearch for large.
- Add redirects when moving pages — broken inbound links are lost readers.

## Rules
- Every page answers one question and says who it's for.
- Put prerequisites at the top; next steps at the bottom.
- Prefer examples over prose; show output.
- Date or version-stamp anything that changes often.
