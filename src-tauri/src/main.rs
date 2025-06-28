#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

fn main() {
    // Start the backend server
    #[cfg(target_os = "windows")]
    {
        std::thread::spawn(|| {
            let _ = Command::new("node")
                .args(&["backend/server.js"])
                .spawn()
                .expect("Failed to start backend");
        });
    }

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
