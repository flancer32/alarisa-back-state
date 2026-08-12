# Root Level

- Path: `AGENTS.md`
- Template Version: `20260702`
- Changed: `20260812`

## Purpose

Root-level working rules for the `@flancer32/alarisa-back-state` package repository.

## Two-Repository Topology

- This repository contains the package implementation.
- `ctx/` is a mounted checkout of the separate private `flancer32/alarisa-back-state-ctx` repository.
- The cognitive context is authoritative. Read `ctx/AGENTS.md` and `ctx/docs/` before changing package meaning or boundaries.

Do not mix commits between the product and context repositories. Do not remove, replace, or relocate `ctx/`.

## Root File Protection

Do not modify this file, `.gitignore`, or `README.md` unless explicitly instructed by the human.

