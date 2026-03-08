# Architectural Review - GenAI Workspace v1

## Overview
This document outlines the findings from the architectural review of the GenAI Workspace application. The application has transitioned from a Python-based backend (FastAPI) to a Node.js-based backend (Express + LowDB) served via `server.ts`.

## 1. Backend Architecture
**Current State:**
- The application is running as a Node.js server (`server.ts`) which handles API requests and serves the frontend.
- A legacy Python backend structure exists in the `backend/` directory but is not used by the running application.
- The `package.json` scripts (`dev`, `start`) point exclusively to `server.ts`.

**Issues:**
- **Dead Code:** The entire Python backend implementation (`backend/main.py`, `models/`, `routes/`, `schemas/`, `services/`, `core/`) is unused and should be removed to prevent confusion.
- **Hybrid Structure:** The `backend/` directory contains both the legacy Python code and the active TypeScript database adapter (`database.ts`) and data storage (`data/`).

**Recommendation:**
- Remove all Python-related files and directories.
- Retain `backend/database.ts` and `backend/data/` as they are used by `server.ts`.
- Ideally, move `backend/database.ts` to `src/server/database.ts` or similar, but to minimize risk in Phase B, we will keep it in place or move it to a `server/` directory if we decide to refactor. *Decision: Keep in `backend/` for now to avoid breaking imports, just clean up the Python files.*

## 2. Frontend Architecture
**Current State:**
- React + Vite application.
- Modular structure in `src/modules/` (Workspace, Admin).
- Shared code in `src/shared/`.

**Issues:**
- **Orphan Components:** `src/components/Layout.tsx` is the only component in `src/components`. It should be moved to `src/shared/components` or `src/modules/layout`.
- **Inconsistent Pages:** `src/pages/` contains only `LoggedOut.tsx`. The main views are in `src/modules/`. This is acceptable but could be cleaner.

**Recommendation:**
- Move `src/components/Layout.tsx` to `src/shared/components/Layout.tsx`.
- Remove `src/components` directory if empty.

## 3. Configuration & Data
**Current State:**
- Root configuration: `admin_config.json`, `admin_user.json`, `config.json`.
- Database data: `backend/data/workspace.json`, `backend/data/users.json`.

**Issues:**
- `admin_config.json` and `admin_user.json` are read from the root by `server.ts`.
- `config.json` seems unused or redundant (need to verify usage in `server.ts` or frontend).

**Recommendation:**
- Verify `config.json` usage.
- Ensure `backend/data/` is preserved.

## 4. Unused Files & Directories
The following files/directories have been identified as unused and safe to remove:
- `backend/__init__.py`
- `backend/config.py`
- `backend/core/`
- `backend/main.py`
- `backend/models/`
- `backend/routes/`
- `backend/schemas/`
- `backend/services/`
- `backend/src/`
- `backend/certs/` (unless used by `server.ts` for SSO - `server.ts` references `SSO_CERT_PATH` env var, but `backend/certs` might be the default location. Need to check `server.ts` logic again).
- `requirements.txt`
- `pyproject.toml`
- `tests/` (Empty)

## 5. Environment Variables
- `server.ts` manually loads `.env`.
- `SSO_CERT_PATH` is used.
- `VITE_SSO_MOCK_MODE` is used.

**Recommendation:**
- Ensure `.env.example` documents these variables.

## Action Plan (Phase B)
1. Remove identified unused Python files and directories.
2. Remove `requirements.txt` and `pyproject.toml`.
3. Remove empty `tests/` directory.
4. Move `src/components/Layout.tsx` to `src/shared/components/Layout.tsx`.
5. Update imports in `App.tsx` and other files referencing `Layout`.
6. Verify `config.json` usage and remove if unused.
