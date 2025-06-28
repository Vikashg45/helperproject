use base64::engine::general_purpose;
use base64::Engine;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn upload_file(file_name: String, file_data: String) -> Result<String, String> {
    // Decode the base64 file data using modern Engine API
    let decoded = general_purpose::STANDARD
        .decode(&file_data)
        .map_err(|e| format!("Decode error: {}", e))?;

    // Save file in the executable's current directory
    let path = PathBuf::from(format!("uploaded_{}", file_name));
    fs::write(&path, decoded).map_err(|e| format!("Write error: {}", e))?;

    Ok(format!("✅ File uploaded successfully: {}", path.display()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            upload_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
