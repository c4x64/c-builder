# Design Document: C-Builder Visual IDE

## 1. Vision
A web-based tool that allows users to create C applications by visually designing the UI and connecting logic blocks. It targets rapid prototyping for C-based systems (e.g., embedded, CLI tools, or simple desktop apps).

## 2. Core Components

### 2.1 UI Designer (PyBuilder Style)
- **Canvas:** A fixed-size or responsive area where widgets are placed.
- **Widget Palette:**
  - `Button`: Trigger events.
  - `Label`: Display text.
  - `Slider`: Numeric input.
  - `TextField`: String input.
- **Interactions:** Drag-and-drop to move, resize (optional), and select.
- **Properties:** Edit widget-specific attributes (name, text, default values).

### 2.2 Logic Editor (UE5 Blueprint Style)
- **Engine:** Powered by React Flow.
- **Node Types:**
  - **Event Nodes:** `UI Event` (e.g., `on_click`), `System Event` (e.g., `on_start`).
  - **Function Nodes:** `printf`, `math_op`, `string_concat`.
  - **Variable Nodes:** `get_var`, `set_var`.
  - **Control Flow:** `Branch` (If/Else), `Sequence`, `For Loop`.
- **Connections:**
  - **Execution Flow (White lines):** Defines the order of operations.
  - **Data Flow (Colored lines):** Transfers values between nodes.

### 2.3 Code Generator
- **Transpiler:** Converts the JSON representation of UI and Logic into valid C code.
- **Template System:** Uses C templates to wrap the logic into a standard C structure (e.g., `main.c`, `handlers.c`).

## 3. Technical Architecture

### 3.1 Frontend
- **React + TypeScript:** For a robust, typed development experience.
- **Vite:** Fast development server and bundling.
- **React Flow:** For the node-based editor.
- **Vanilla CSS:** For styling, ensuring a custom "UE5-like" aesthetic.

### 3.2 Backend (Optional but recommended)
- **Node.js/Express:** To handle complex code generation and zip bundling for export.

## 4. Implementation Phases

### Phase 1: Project Setup & Scaffolding
- Initialize React project.
- Setup basic layout (Sidebar, Canvas, Panels).

### Phase 2: UI Designer
- Implement widget palette and canvas.
- Basic drag-and-drop for placement.
- Properties panel for widget configuration.

### Phase 3: Logic Editor
- Integrate React Flow.
- Define custom node components (Execution vs. Data pins).
- Implement basic logic flow (Event -> Function).

### Phase 4: Code Generation
- Develop the JSON-to-C converter.
- Add "Live Code Preview" panel.

### Phase 5: Polishing
- UE5-inspired dark theme.
- Export functionality.

## 5. Mockup Structure (Files)
- `/src/components/UIBuilder/`
- `/src/components/LogicEditor/`
- `/src/components/CodePreview/`
- `/src/store/` (State management for UI and Logic)
- `/src/generator/` (C code generation logic)
