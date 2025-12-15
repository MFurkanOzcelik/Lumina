# Windows Context Menu Integration

## "Open with Lumina" Feature

Lumina now integrates seamlessly with Windows Explorer, allowing you to open files directly from the context menu.

## 🎯 Features

### Context Menu Integration
- Right-click any file in Windows Explorer
- Select **"Open with Lumina"** from the context menu
- File opens instantly in Lumina as a new note

### Supported File Types

Lumina automatically handles the following file formats:

| Extension | Type | Description |
|-----------|------|-------------|
| `.lum` | Lumina Note | Native Lumina note format |
| `.txt` | Plain Text | Text files with automatic paragraph formatting |
| `.md` | Markdown | Markdown files with title extraction |
| `.json` | JSON | JSON files with syntax highlighting |

## 📦 Installation

The context menu integration is automatically installed when you run the **Lumina Setup** installer.

### What Gets Installed:

1. **Registry Entries:**
   - `HKCU\Software\Classes\*\shell\OpenWithLumina` - Context menu entry
   - File associations for .txt, .md, .json, .lum

2. **"Open With" List:**
   - Lumina appears in the "Open with" dialog for supported file types

3. **File Icons:**
   - Supported file types show Lumina's document icon

## 🚀 Usage

### Method 1: Context Menu (Right-Click)

1. Navigate to any `.txt`, `.md`, `.json`, or `.lum` file in Windows Explorer
2. Right-click the file
3. Select **"Open with Lumina"**
4. File opens immediately in Lumina

### Method 2: "Open With" Dialog

1. Right-click any file
2. Select **"Open with"** → **"Choose another app"**
3. Select **Lumina** from the list
4. Optionally check "Always use this app" for automatic opening

### Method 3: Double-Click (After Association)

1. If you've set Lumina as the default app for a file type
2. Simply double-click the file
3. It opens directly in Lumina

## 🎨 File Format Handling

### Markdown Files (.md)
```markdown
# My Document Title

This is the content...
```
- Extracts the first `# heading` as the note title
- Remaining content becomes the note body

### JSON Files (.json)
```json
{
  "key": "value"
}
```
- Automatically formatted with indentation
- Displayed with syntax highlighting in a code block

### Text Files (.txt)
```
Line 1
Line 2
Line 3
```
- Each line converted to an HTML paragraph
- Preserves line breaks and formatting

### Lumina Files (.lum)
```markdown
# Note Title

Note content in markdown format...
```
- Native format with full markdown support
- Title and content automatically parsed

## 🔧 Technical Details

### Registry Keys Created

```registry
HKCU\Software\Classes\*\shell\OpenWithLumina
  (Default) = "Open with Lumina"
  Icon = "C:\Program Files\Lumina\Lumina.exe"
  
HKCU\Software\Classes\*\shell\OpenWithLumina\command
  (Default) = "C:\Program Files\Lumina\Lumina.exe" "%1"
```

### Command Line Arguments

When launched via context menu:
```bash
Lumina.exe "C:\path\to\file.txt"
```

The file path is passed as the first argument and automatically processed.

## 🗑️ Uninstallation

When you uninstall Lumina:
- All registry entries are automatically removed
- File associations are cleaned up
- No manual cleanup required

## ⚙️ Advanced Configuration

### Adding More File Types

To add support for additional file types, modify `package.json`:

```json
"fileAssociations": [
  {
    "ext": "custom",
    "name": "Custom Document",
    "description": "Custom File Type",
    "role": "Editor",
    "icon": "build/document-icon.ico"
  }
]
```

Then rebuild the installer:
```bash
npm run electron:build:win
```

## 🐛 Troubleshooting

### Context Menu Not Appearing

1. **Reinstall Lumina:**
   - Run the installer again
   - Registry entries will be recreated

2. **Restart Windows Explorer:**
   ```powershell
   taskkill /f /im explorer.exe
   start explorer.exe
   ```

3. **Check Registry Manually:**
   - Open Registry Editor (`regedit`)
   - Navigate to `HKCU\Software\Classes\*\shell\OpenWithLumina`
   - Verify the entries exist

### File Not Opening

1. **Check File Path:**
   - Ensure the file path doesn't contain special characters
   - Try moving the file to a simpler path

2. **Check File Encoding:**
   - Lumina expects UTF-8 encoded files
   - Convert the file if necessary

3. **Check File Size:**
   - Very large files (>50MB) may take time to load
   - Consider splitting large files

### File Association Issues

1. **Reset Default Programs:**
   - Settings → Apps → Default apps
   - Reset defaults for file types

2. **Rebuild File Associations:**
   - Uninstall Lumina
   - Reinstall with the latest installer

## 📝 Notes

- Context menu integration is **Windows-only**
- Requires Windows 7 or later
- Administrator rights not required (per-user installation)
- Works with both installer and portable versions (after first run)

## 🔗 Related Features

- **F12 Key:** Toggle fullscreen mode
- **ESC Key:** Exit fullscreen mode
- **Auto-update:** Automatic updates for new versions
- **File Storage:** All notes saved locally in `%APPDATA%\Lumina`

## 📞 Support

If you encounter any issues with the context menu integration:

1. Check this documentation
2. Try reinstalling Lumina
3. Report issues on [GitHub Issues](https://github.com/MFurkanOzcelik/Lumina/issues)

---

**Version:** 1.2.0  
**Last Updated:** December 15, 2025

