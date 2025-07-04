# Tauri + React + Node.js POC Application

This project is a **proof-of-concept desktop application** built with:

- 🦀 **Tauri** (for cross-platform desktop shell)
- ⚛️ **React** (frontend)
- 🟢 **Node.js** (backend server)
- 🗄️ **SQLite** (data storage)

It demonstrates how to:
- Upload and parse a text file with `|`-separated headers and data
- Store the parsed records in a database
- Display the data in a grid with search, scroll, and pagination

---

## 🗂️ Folder Structure

my-tauri-app/
├── backend/ # Node.js backend (Express + SQLite)
│ ├── server.js
│ ├── db.js
│ └── data/
│ └── GeneratedData.txt
│
├── src/ # React frontend
│ ├── App.jsx
│ └── ...
│
├── src-tauri/ # Tauri config and Rust code
│ ├── main.rs
│ └── tauri.conf.json
│
├── public/
├── package.json # React dependencies
├── vite.config.js # Vite configuration
└── README.md

yaml
Copy
Edit

---

## ⚙️ How to Run

### 1️⃣ Install dependencies

**Backend dependencies:**

```bash
cd backend
npm install
Frontend dependencies:

bash
Copy
Edit
cd ..
npm install
Rust / Tauri setup:

Make sure Rust is installed:

bash
Copy
Edit
rustc --version
If not, install from https://rustup.rs

2️⃣ Start Backend Server
In backend/:

bash
Copy
Edit
node server.js
This starts the Node.js API on http://localhost:3001.

3️⃣ Load Data into Database
Open your browser and visit:

bash
Copy
Edit
http://localhost:3001/api/load-file
This will parse GeneratedData.txt and save records.

4️⃣ Run Desktop App
In the root folder:

bash
Copy
Edit
npm run tauri dev
This will open the native desktop window.

✨ Features
✅ Text file parsing (|-separated headers)
✅ SQLite storage
✅ REST API (/api/data) with pagination and search
✅ React UI table with search, scroll, and pagination
✅ Tauri packaging for Windows desktop

📦 Building Installer
To build a production .exe:

bash
Copy
Edit
npm run tauri build
You’ll find the installer in:

swift
Copy
Edit
src-tauri/target/release/bundle/
🙏 Credits
Tauri

React

Node.js

SQLite

📄 License
This is a personal POC project. Use freely for learning and experimentation.

yaml
Copy
Edit
