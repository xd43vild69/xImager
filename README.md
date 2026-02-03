<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# xImager - ComfyUI Workflow Orchestrator

xImager is a modern, streamlined interface for executing and managing [ComfyUI](https://github.com/comfyanonymous/ComfyUI) workflows. It abstracts the node graph complexity into a user-friendly "Execution View," allowing you to focus on prompting and image generation.

## 🚀 Key Features

### 🎨 Workflow Orchestration
-   **Seamless Integration**: Load and execute ComfyUI workflows (`.json` API format) directly.
-   **Dynamic Discovery**: Simply drop a new workflow file into `public/workflows`, and it automatically appears in the dropdown list—no restart required.
-   **Searchable Selection**: Quickly find the tool you need with a searchable workflow dropdown.
-   **Workflow Management**: Rename workflows directly from the Settings panel.

### 🖼️ Smart Image Handling
-   **Multi-Image Support**: The UI automatically analyzes the workflow to determine how many reference images are needed (1, 2, or more) and creates the appropriate number of input slots.
-   **Clipboard Integration**:
    -   **Global Paste**: Paste from your clipboard to fill the first empty slot.
    -   **Targeted Paste**: Use the specific "Paste" button on any slot to insert an image exactly where you want it.
-   **Drag & Drop**: Intuitive file handling for all input slots.

### ⌨️ Productivity Tools
-   **Keyword Expansion**: Define custom text macros (e.g., `@hq` → "4k, high detailed, masterpiece") in the **Keywords Manager**. Typing the macro in your prompt automatically expands it before execution.
-   **Prompt History**: Automatically records used prompts for easy retrieval.
-   **Keyboard Shortcuts**: Use **Cmd/Ctrl + Enter** to instantly run the current workflow.

### ⚡ Execution & Monitoring
-   **Real-time Logs**: Collapsible log feed displays detailed progress, including connection status, upload progress, and sampling steps.
-   **Live Preview**: Outputs are displayed immediately upon completion.
-   **Quick Actions**: Copy the result to clipboard or open in a new tab with a single click.

## 🛠️ Setup & Installation

### Prerequisites
-   Node.js (v18+)
-   A running instance of [ComfyUI](https://github.com/comfyanonymous/ComfyUI)

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your ComfyUI URL in `.env.local` (default is `http://127.0.0.1:8188`):
    ```original
    VITE_COMFY_API_URL=http://127.0.0.1:8188/api/comfy
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

## 📖 Usage Guide

### Adding Workflows
Export your workflow from ComfyUI in **API Format** (Save (API Format) button) and save the `.json` file to the `public/workflows/` directory. xImager will detect it automatically.

### Using Keywords
1.  Open the Sidebar and go to **Keywords**.
2.  Add a shortcut (e.g., `face_fix`) and its replacement text.
3.  In the prompt box, type `@face_fix` to use it.


---

### TODO

1. Create a new modal to extend output image

[x] size image
- seed fix or increase
- denoise sampler for i2i



- sonido al finalizar un proceso

- batch size and read input from folder 


