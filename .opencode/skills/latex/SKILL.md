---
name: latex
description: "Use when writing, structuring or debugging LaTeX documents — papers, theses, reports and CVs — choosing pdfLaTeX, LuaLaTeX or XeLaTeX, preamble and package load order, latexmk builds, biblatex with biber bibliographies, figures, booktabs and siunitx tables, amsmath equations, cleveref cross-references, Overleaf settings, tagged PDFs with DocumentMetadata, and fixing common compile errors."
license: MIT
---

# LaTeX Documents

Make the agent produce LaTeX projects that compile cleanly from scratch with one command,
use a modern package set (biblatex/biber, booktabs, cleveref), keep the source organised, and
fix errors from the log rather than by guesswork. For diagrams embedded as code see
`mermaid-diagrams` or `plantuml`; for converting or merging PDFs see `pdf-handling`.

## When to Use This Skill
- Starting a paper, thesis, report or CV in LaTeX, locally or on Overleaf
- Adding citations with biblatex and biber, or migrating from BibTeX `\bibliographystyle`
- Making publication-quality tables, figures, equations and cross-references
- A build fails, citations show as **[?]** or bold keys, or references read "??"
- Setting up a reproducible build in CI with latexmk

## Workflow
1. **Pick the engine.** pdfLaTeX for most journal templates; LuaLaTeX for system/OpenType fonts
   (`fontspec`), Unicode-heavy text, or accessible math tagging; XeLaTeX only if a template requires it.
   If a publisher class is given, use it unchanged.
2. **Lay out the project:** `main.tex`, `sections/*.tex` (pulled in with `\input`), `figures/`,
   `refs.bib`, `latexmkrc`. One sentence per line makes diffs and reviews readable.
3. **Write the preamble** in the order below; load `hyperref` late and `cleveref` after it.
4. **Build with latexmk**, which reruns LaTeX and biber as many times as needed.
5. **Read the log**, fix the first error first, then clear warnings about undefined references and citations.
6. **Clean build before submitting:** `latexmk -C` then a full build.

## Minimal Modern Document
```latex
% \DocumentMetadata{lang=en, pdfstandard={UA-2,A-4f}, tagging=on} % optional tagged PDF; must precede \documentclass
\documentclass[11pt,a4paper]{article}     % letterpaper for US submissions
\usepackage[T1]{fontenc}                  % pdfLaTeX only; with LuaLaTeX use \usepackage{fontspec}
\usepackage[british]{babel}               % or american; sets hyphenation
\usepackage{lmodern,microtype}
\usepackage{amsmath,amssymb}
\usepackage{graphicx,booktabs,siunitx}
\usepackage{csquotes}
\usepackage[backend=biber,style=authoryear,maxcitenames=2]{biblatex}
\addbibresource{refs.bib}                 % include the .bib extension
\usepackage[hidelinks]{hyperref}          % load late
\usepackage[capitalise,noabbrev]{cleveref}% after hyperref

\title{Latency of Idempotent Writes}
\author{A.~Author \and B.~Author}
\date{\today}

\begin{document}
\maketitle
\begin{abstract} We measure \ldots \end{abstract}

\section{Introduction}\label{sec:intro}
Retries are cheap \parencite{kleppmann2017}; \textcite{lamport1978} explains ordering.
\Cref{fig:latency} and \cref{tab:results} summarise the results, and \cref{eq:p99} defines the metric.

\begin{equation}\label{eq:p99}
  L_{99} = \inf\{\, t : P(T \le t) \ge 0.99 \,\}
\end{equation}

\begin{figure}[tbp]
  \centering
  \includegraphics[width=0.8\linewidth]{figures/latency.pdf}
  \caption{p99 latency by retry policy.}\label{fig:latency}  % label after caption
\end{figure}

\begin{table}[tbp]
  \centering
  \caption{Write latency (ms).}\label{tab:results}
  \begin{tabular}{l S[table-format=3.1] S[table-format=3.1]}
    \toprule
    Policy & {p50} & {p99} \\
    \midrule
    No retry   & 12.4 & 98.0 \\
    Idempotent & 13.1 & 104.5 \\
    \bottomrule
  \end{tabular}
\end{table}

\printbibliography
\end{document}
```
```bibtex
@book{kleppmann2017,
  author    = {Kleppmann, Martin},
  title     = {Designing Data-Intensive Applications},
  publisher = {O'Reilly Media},
  date      = {2017},
}
@article{lamport1978,
  author  = {Lamport, Leslie},
  title   = {Time, Clocks, and the Ordering of Events in a Distributed System},
  journaltitle = {Communications of the ACM},
  volume  = {21}, number = {7}, pages = {558--565}, date = {1978},
  doi     = {10.1145/359545.359563},
}
```

## Build Configuration
```perl
# latexmkrc (also honoured by Overleaf when placed in the project root)
$pdf_mode = 1;          # 1 = pdflatex, 4 = lualatex, 5 = xelatex
$out_dir  = 'build';   # local builds; omit on Overleaf, which manages output itself
@default_files = ('main.tex');
```
```bash
latexmk -interaction=nonstopmode -halt-on-error -file-line-error main.tex
latexmk -pvc main.tex     # watch and rebuild while editing
latexmk -c                # remove auxiliary files (-C also removes the PDF)
```
On Overleaf: Menu → Settings → Compiler for the engine, and the TeX Live version selector
(TeX Live 2026 is current; existing projects keep their original version until changed).
Set the main document explicitly if the project has several `.tex` files.

## Choices
| Need | Use | Avoid |
|------|-----|-------|
| Bibliography | `biblatex` + `biber` (`\parencite`, `\textcite`) | Mixing `\bibliographystyle`/`\bibliography` with biblatex |
| Table rules | `booktabs` (`\toprule`, `\midrule`, `\bottomrule`) | Vertical lines and `\hline` grids |
| Numbers and units | `siunitx` (`\qty{3.2}{\milli\second}`, `S` columns) | Hand-aligned decimals, `$ms$` |
| Multi-line equations | `align`, `gather` from amsmath | `eqnarray`, `$$ … $$` |
| Cross-references | `\cref`/`\Cref` with `sec:`, `fig:`, `tab:`, `eq:` label prefixes | Typing "Figure 3" by hand |
| Fonts | `fontspec` on LuaLaTeX; `lmodern`/`newtx` on pdfLaTeX | Loading `fontenc`/`inputenc` with `fontspec` |

## Rules
- Build with latexmk (or Overleaf); never hand-run pdflatex/biber sequences in scripts.
- Escape special characters in text: `\& \% \$ \# \_ \{ \} \textasciitilde{} \textbackslash{}`.
- Put `\label` after `\caption` inside floats; label every numbered thing you refer to.
- Use vector figures (PDF/SVG converted to PDF) for plots; PNG only for photos and screenshots.
- Keep journal or university class files unmodified; put overrides in the preamble.
- Check in the `.bib` file and `latexmkrc`; ignore `build/` and auxiliary files.

## Common Mistakes
- **"Undefined control sequence".** Typo or missing package; the log line after `l.<number>` shows the command.
- **"Missing $ inserted".** Math (`_`, `^`, `\alpha`) used in text mode; wrap in `$…$` or escape `_`.
- **Citations print as bold keys and "??".** Biber never ran or `\addbibresource` lacks `.bib`; run latexmk, and check `main.blg`.
- **"Option clash for package".** Same package loaded twice with different options, often by the class; pass options via `\PassOptionsToPackage` before `\documentclass`.
- **"Unicode character … not set up for use with LaTeX".** pdfLaTeX with an unusual character; replace it, define it, or switch to LuaLaTeX.
- **Wrong figure numbers in references.** `\label` before `\caption`.
- **Overfull \hbox warnings.** Long URLs or words; load `microtype`, use `\url{}` from hyperref, or rephrase.

## Verify
```bash
latexmk -C && latexmk -interaction=nonstopmode -halt-on-error main.tex   # clean build succeeds
grep -nE "LaTeX Warning: (Reference|Citation)|undefined|There were undefined" build/main.log   # expect nothing
grep -n "WARN" build/main.blg                                          # biber warnings
pdffonts build/main.pdf | head                                          # all fonts embedded ("emb" = yes)
```
- Open the PDF and click every cross-reference and link; check that the bibliography is complete and sorted as the style requires.
- If a template or submission system is specified, compile with its TeX Live version and engine.
