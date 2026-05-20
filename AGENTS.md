# C-Builder Visual IDE (fyt)

## Commands

| Command | What |
|---|---|
| `npm run dev` | Vite frontend on `:5173` |
| `npm run server` | Express OAuth proxy on `:3001` (separate terminal) |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | `eslint .` |
| `npm run preview` | `vite preview` |

No test framework installed.

## Architecture

- **`src/main.tsx`** — React entrypoint
- **`src/App.tsx`** — main shell, 3-mode view-switcher (UI / LOGIC / CODE)
- **`src/components/UIBuilder/`** — drag-and-drop widget canvas + toolbox + properties panel
- **`src/components/LogicEditor/`** — React Flow blueprint editor with exec/data pins
- **`src/components/LogicEditor/CustomEdge.tsx`** — edge component with delete-on-select button (fixes edge unlinking)
- **`src/components/CodePreview/`** — live C code preview with token-level syntax highlighting
- **`src/components/ProjectsPage.tsx`** — project create/open/delete landing page
- **`src/generator/cGenerator.ts`** — JSON → C transpiler (raylib + raygui)
- **`src/github.ts`** — GitHub OAuth flow + "Compile & Run" via GitHub Actions push
- **`src/plugins/registry.ts`** — plugin definitions (android, root, windows-efi, etc.)
- **`server/index.ts`** — `/api/github/token` OAuth proxy (loads `.env` via dotenv), serves built frontend in production
- **`src/store/useStore.ts`** — Zustand store, persisted to `localStorage` key `cb_projects`

## TypeScript quirks (from `tsconfig.app.json`)

- `noUnusedLocals: true`, `noUnusedParameters: true` — unused imports/vars are errors at build
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `erasableSyntaxOnly: true` — no enums, no namespaces, no parameter properties

## Development setup

- Vite proxies `/api` → `http://localhost:3001` (see `vite.config.ts`)
- Two-terminal workflow: `npm run dev` + `npm run server`
- For production: `npm run build && NODE_ENV=production npm run server` (Express serves the built frontend so OAuth callback works on a single port)
- Required env vars (copy `.env.example`):
  - `VITE_GITHUB_CLIENT_ID` — from GitHub OAuth App
  - `GITHUB_CLIENT_SECRET` — server-side only
- OAuth callback URL must be `http://localhost:5173` (no `/auth/callback` suffix)
- Server auto-loads `.env` via `dotenv` (no manual export needed)

## "Compile & Run" flow

- Requires GitHub OAuth connection (otherwise the button is disabled)
- C code is pushed to a **new public repo** on GitHub + CI workflow, then opens the Actions page
- Generated C depends on raylib (build installs `libraylib-dev` via apt in CI)

## Project types affect views

- `gui` — show all three tabs (UI Design / Logic Graph / C Code)
- `cli` — UI tab hidden (no raylib widgets); only Logic + Code
- `library` — UI tab hidden; only Logic + Code (generates .h function declarations)

## Code generation

- **gui**: raylib `DrawRectangle`, `DrawText`, `GuiSlider` calls in a window loop
- **cli**: standard C with printf/scanf, no raylib dependency
- **library**: function declarations / header outline
- Logic nodes → C control flow (if/else, for/while loops, math, comparisons, function calls)
- Event nodes generate `On_<name>_Clicked()` / `OnStart()` functions
- Available logic nodes include: Add, Subtract, Multiply, Divide, Greater/Less Than, Equals, String Equals, And/Or/Not, While Loop, Delay (ms), Read Integer, Set/Get Variable, Print/String, Branch/For Loop
- Plugin system (`src/plugins/registry.ts`) modifies output: root, android-ndk, windows-efi, linux-kmod, windows-gui, or none

## Edge & node interactions

- Select an edge → a red ✕ delete button appears at midpoint (or press Delete/Backspace)
- Right-click canvas → context menu to add nodes at cursor position
- Exec pins (diamond shape) control flow order; data pins (colored circles) pass values
- Edge `interactionWidth: 20` makes thin edges easier to click

## CSS conventions

- Vanilla CSS (no framework), split across `src/App.css` and `src/index.css`
- Dark theme via CSS custom properties on `:root`
- `.app-container` → `.top-bar` → `.main-content` layout
