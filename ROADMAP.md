# 🚀 Lumina - Project Roadmap & Architecture

## 📋 Project Overview
**Lumina** is a desktop note-taking and PKM application built with **Electron.js** (Main Process) and **React** (Renderer). It aims for deep OS integration and seamless user experience.

**Tech Stack:**
* **Core:** Electron (IPC via `preload.js`)
* **Frontend:** React, Tailwind CSS
* **Data:** Local File System & `localStorage` for UI state.

**Current State:**
* ✅ **Security (Phase 2):** Completed (Master Password & Encryption implemented).
* ✅ **Sidebar Org (Phase 3):** Completed (Folder Drag & Drop implemented).

---

## 🔥 Phase 1: Core Experience & Stability (High Priority)
The immediate goal is to make the app behave like a native tool (safe closing, state restoration).

- [ ] **1. Unsaved Changes Protection (Safe Exit):**
    - [ ] **Goal:** Prevent accidental data loss when closing the app with unsaved edits.
    - [ ] **Logic:**
        - Track `isDirty` (unsaved) state in the Editor.
        - Intercept the close request in Main Process.
        - Show a **Custom Modal** (Save / Discard / Cancel).
        - **Critical:** Ensure `app.exit()` is called correctly to prevent hanging processes (zombie process issue).

- [ ] **2. Session Persistence (Resume State):**
    - [ ] **Goal:** App must open exactly how it was closed.
    - [ ] **Logic:**
        - Save `activeNoteId`, `expandedFolderIds`, and `sidebarWidth` to `localStorage`.
        - On startup, read these values and initialize React state.

- [ ] **3. "Open with Lumina" Integration:**
    - [ ] **Goal:** Double-clicking a text/md file in OS launches Lumina.
    - [ ] **Logic:** Handle `process.argv` (Windows) and `open-file` (macOS).

- [ ] **4. Drag & Drop: File Opening:**
    - [ ] **Goal:** Dragging an external file (e.g., `.txt`) onto the Editor opens it.
    - [ ] **Logic:** Handle `onDrop` event to read file path and load content.

---

## 🚧 Phase 3: Remaining UI Polish
- [ ] **Editor Image Support:**
    - [ ] **Goal:** Dragging an image (`.png`, `.jpg`) inserts it into the markdown content.
    - [ ] **Logic:** Copy image to local assets folder and reference it.

---

## 🤖 Notes for Copilot (Context)
* **Focus:** Only work on the unchecked `[ ]` tasks above.
* **Security Context:** Encrypted notes logic is already in `NoteEditor.jsx` and `main.js`. Do not break existing encryption flows while adding new features.
* **Stability:** When implementing "Unsaved Changes", be very careful with `mainWindow.close()` vs `app.quit()` loop.