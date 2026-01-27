## Streaming ChatBot Quick Start

# Installation

## Prerequisites

- Python 3.12～3.14
- Git
- Virtual environment (recommended)

## Quick Installation

### 1. Create Virtual Environment

#### Option A: Using uv (recommended)

```bash
# macOS/Linux
uv venv .venv
source .venv/bin/activate

# Windows (PowerShell)
uv venv .venv
.\.venv\Scripts\Activate.ps1

```
#### Option B: Using built-in venv
```bash
# macOS/Linux
python -m venv .venv
source .venv/bin/activate

# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

```
### 2. Install Dependencies

```bash
#uv （recommend）
uv pip install -e .

#venv
pip install -e .
```
If you want to enable Mem0 support
```bash
uv pip install ".[memory]"
# or
pip install ".[memory]"
```
---

### 3.Configure an OpenRouter or other API key（include gemini，anthropic，deepseek，openai）\*\*

Put the key into `.env`:

```
OPENROUTER_API_KEY=sk-xxxx
```

You can adjust the `llm_provider` and `model_name` in `streaming_chatbot.py`’s `ChatBot(...)`.

---

### 4. Run the Demo

```bash
python spoon-starter/streaming_chatbot.py
```

The script asks three generic topics in sequence. Each round prints:

LLM tokens stream in real time.

---

### 5. Tips

- **`Cleanup failed for ...`** – means a provider isn’t configured; safe to ignore.
- **`websockets.legacy` DeprecationWarning** – upstream warning, safe to ignore.
