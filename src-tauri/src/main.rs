#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::Command;
use std::os::windows::process::CommandExt;

fn main() {
    #[cfg(target_os = "windows")]
    {
        std::thread::spawn(|| {
            println!("🚀 Attempting to start Node backend...");

            // Find the EXE directory
            let exe_dir = std::env::current_exe()
                .expect("Failed to get exe path")
                .parent()
                .expect("No parent dir")
                .to_path_buf();

            // Compose the path to resources/server.cjs
            let server_path = exe_dir.join("resources").join("server.cjs");

            println!("🔍 Server path: {:?}", server_path);

            let result = Command::new("node")
                .arg(server_path)
                .creation_flags(0x08000000)
                .spawn();

            match result {
                Ok(_) => println!("✅ Node backend spawned successfully."),
                Err(e) => println!("❌ Failed to spawn backend: {:?}", e),
            }
        });
    }

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
