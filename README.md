# Galender

> **A minimalist, state-of-the-art Markdown Calendar App built entirely through seamless Pair Programming by a Human (Yusuf) and an AI (Antigravity by Google DeepMind).**

Galender is a sleek, completely private, self-hosted web application that combines the simplicity of bullet journaling with the power of Markdown and a pristine calendar interface. It is purposefully designed to be self-hosted on your own hardware, giving you 100% ownership and control over your data with zero third-party dependencies.

---

## Features

- **Self-Hosted & Private:** Keep your data securely on your own server. Galender is strictly invite-only, with public registration inherently disabled.
- **Interactive Markdown Calendar:** A fully responsive monthly calendar grid seamlessly synced to a split-pane, real-time Markdown editor.
- **Admin Dashboard:** A built-in superuser account lets you provision new users, reset passwords, and manage access from a centralized UI.
- **Defensive Data Architecture:** Notes are safely categorized into `data/{username}/notes/YYYY/` directories. Deleting a user securely archives their entire note history to prevent accidental data loss.
- **Premium UI/UX:** Built entirely with Vanilla HTML, CSS, and JS. Features a responsive "Glassmorphism" design, deep dark mode, and fluid micro-animations without relying on bloated modern web frameworks.

---

## Technology Stack

**Backend:**
- FastAPI (Asynchronous API routing)
- SQLite / SQLAlchemy (Per-user scalable multi-database architecture)
- bcrypt & python-jose (Secure credential hashing & JWTs)

**Frontend:**
- Vanilla JavaScript & CSS3 
- Marked.js (Real-time client-side Markdown rendering)

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ysfduzgun/galender.git
   cd galender
   ```

2. **Create a Python Virtual Environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install fastapi "uvicorn[standard]" sqlalchemy bcrypt python-jose[cryptography] python-multipart pydantic-settings
   ```

4. **Run the Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

5. **Initialize:**
   - Access your self-hosted instance at `http://127.0.0.1:8000`.
   - On the very first run, the system auto-generates the master account.
   - Login using the default credentials: `admin` / `admin`.

---

*Note: This entire project was architected, written, and refined conversationally through Advanced Agentic Coding.*
