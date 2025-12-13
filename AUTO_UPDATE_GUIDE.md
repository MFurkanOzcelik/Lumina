# Auto-Update Implementation Guide

## Overview

Lumina now includes an automatic update mechanism using `electron-updater`. Users will be notified when a new version is available, the update will download in the background, and they can install it with a single click.

## How It Works

### 1. **Update Check**
- When the app launches (production mode only), it checks for updates after 3 seconds
- The check happens silently in the background
- Uses GitHub Releases as the update server

### 2. **Update Download**
- If an update is available, it automatically starts downloading
- A notification banner appears showing download progress
- Users can continue working while the update downloads

### 3. **Update Installation**
- Once downloaded, the notification changes to "Update Ready!"
- User clicks "Restart to Update" button
- App quits and installs the new version automatically
- App restarts with the new version

## User Experience

### Visual Feedback

1. **Downloading State**
   - Banner appears at the top of the screen
   - Shows "Downloading Update..." message
   - Displays a progress bar with percentage
   - Cannot be dismissed during download

2. **Ready to Install State**
   - Banner changes to "Update Ready!"
   - Shows "Restart to Update" button
   - User can dismiss the notification (X button)
   - Update will install on next app restart if dismissed

### Translations

The update notifications support both English and Turkish:

**English:**
- "Downloading Update..."
- "Update Ready!"
- "Restart to install the latest version"
- "Restart to Update"

**Turkish:**
- "Güncelleme İndiriliyor..."
- "Güncelleme Hazır!"
- "En son sürümü yüklemek için yeniden başlatın"
- "Güncellemek İçin Yeniden Başlat"

## Technical Implementation

### Files Modified/Created

1. **electron/main.js**
   - Imported `autoUpdater` from `electron-updater`
   - Configured logging with `electron-log`
   - Added event handlers for update lifecycle
   - Implemented `checkForUpdatesAndNotify()` on app ready
   - Added IPC handler for `install-update`

2. **electron/preload.js**
   - Exposed update event listeners to renderer
   - Added `installUpdate()` method

3. **package.json**
   - Added `publish` configuration for GitHub releases
   - Configured owner, repo, and release type

4. **src/components/UpdateNotification.tsx** (NEW)
   - React component for update UI
   - Handles all update states
   - Shows progress bar during download
   - Provides install button when ready

5. **src/types/electron.d.ts**
   - Added TypeScript definitions for update API
   - Defined `UpdateInfo` and `DownloadProgress` interfaces

6. **src/utils/translations.ts**
   - Added translation keys for update messages

7. **src/App.tsx**
   - Integrated `UpdateNotification` component

### Auto-Updater Events

```javascript
// Checking for updates
autoUpdater.on('checking-for-update', () => { ... })

// Update found
autoUpdater.on('update-available', (info) => { ... })

// No update found
autoUpdater.on('update-not-available', (info) => { ... })

// Download progress
autoUpdater.on('download-progress', (progressObj) => { ... })

// Update downloaded and ready
autoUpdater.on('update-downloaded', (info) => { ... })

// Error occurred
autoUpdater.on('error', (err) => { ... })
```

## Publishing Updates

### Prerequisites

1. **GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a token with `repo` scope
   - Set as environment variable: `GH_TOKEN=your_token_here`

2. **Version Bump**
   - Update version in `package.json`
   - Follow semantic versioning (e.g., 1.2.0 → 1.3.0)

### Build and Publish

```bash
# Set GitHub token (Windows PowerShell)
$env:GH_TOKEN="your_github_token"

# Build and publish (this will create a GitHub release)
npm run electron:build:win -- --publish always

# Or build without publishing (for testing)
npm run electron:build:win
```

### GitHub Release Configuration

The `package.json` includes:

```json
"publish": {
  "provider": "github",
  "owner": "MFurkanOzcelik",
  "repo": "Lumina",
  "releaseType": "release"
}
```

### What Gets Published

When you publish, electron-builder will:
1. Create a new GitHub Release with the version tag
2. Upload the following files:
   - `Lumina Setup X.X.X.exe` (installer)
   - `Lumina X.X.X.exe` (portable)
   - `latest.yml` (update metadata)
   - `.blockmap` files (for delta updates)

## Testing Auto-Update

### Local Testing (Without Publishing)

1. **Build current version:**
   ```bash
   npm run electron:build:win
   ```

2. **Install and run the built app**

3. **Bump version in package.json** (e.g., 1.2.0 → 1.2.1)

4. **Build new version:**
   ```bash
   npm run electron:build:win
   ```

5. **Create a local update server** (for testing):
   ```bash
   # Install http-server globally
   npm install -g http-server
   
   # Serve the release folder
   cd release
   http-server -p 8080 --cors
   ```

6. **Point autoUpdater to local server** (in main.js):
   ```javascript
   if (isDev) {
     autoUpdater.updateConfigPath = path.join(__dirname, '../dev-app-update.yml');
   }
   ```

### Production Testing

1. **Publish a new version to GitHub**
2. **Install the previous version**
3. **Launch the app**
4. **Wait for update notification**
5. **Click "Restart to Update"**
6. **Verify new version is installed**

## Configuration Options

### Auto-Update Settings (main.js)

```javascript
// Check for updates on startup (production only)
if (!isDev) {
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
}

// Logging level
autoUpdater.logger.transports.file.level = 'info';

// Auto-download (default: true)
autoUpdater.autoDownload = true;

// Auto-install on app quit (default: true)
autoUpdater.autoInstallOnAppQuit = true;
```

### Update Check Frequency

Currently, the app checks for updates only on startup. To check periodically:

```javascript
// Check every 4 hours
setInterval(() => {
  autoUpdater.checkForUpdatesAndNotify();
}, 4 * 60 * 60 * 1000);
```

## Security Considerations

1. **Code Signing**
   - Updates are automatically verified by electron-updater
   - Uses the code signature from the original installation
   - Unsigned apps will show security warnings

2. **HTTPS Only**
   - GitHub Releases use HTTPS by default
   - Never use HTTP for update servers

3. **Version Validation**
   - electron-updater validates version numbers
   - Only installs newer versions
   - Uses semantic versioning comparison

## Troubleshooting

### Update Not Detected

1. **Check GitHub Release:**
   - Ensure release is published (not draft)
   - Verify `latest.yml` is uploaded
   - Check version number is higher than current

2. **Check Logs:**
   - Logs are in: `%APPDATA%/Lumina/logs/`
   - Look for update-related errors

3. **Verify Configuration:**
   - Check `package.json` publish settings
   - Ensure owner/repo names are correct

### Update Download Fails

1. **Network Issues:**
   - Check internet connection
   - Verify GitHub is accessible
   - Check firewall settings

2. **File Permissions:**
   - Ensure app has write permissions
   - Check antivirus isn't blocking download

### Update Installation Fails

1. **App Running:**
   - Close all instances of the app
   - Check Task Manager for background processes

2. **Permissions:**
   - Run as administrator if needed
   - Check Windows UAC settings

## Best Practices

1. **Version Numbering**
   - Use semantic versioning (MAJOR.MINOR.PATCH)
   - Increment PATCH for bug fixes
   - Increment MINOR for new features
   - Increment MAJOR for breaking changes

2. **Release Notes**
   - Always include release notes in GitHub Release
   - Describe what's new/fixed
   - Mention breaking changes

3. **Testing**
   - Test updates on clean install
   - Test on different Windows versions
   - Verify update from multiple previous versions

4. **Rollback Plan**
   - Keep previous versions available
   - Document rollback procedure
   - Test downgrade scenarios

## Future Enhancements

Potential improvements for the auto-update system:

1. **Update Preferences**
   - Allow users to disable auto-updates
   - Option to download but not install automatically
   - Scheduled update checks

2. **Release Channels**
   - Stable channel (current)
   - Beta channel for testing
   - Dev channel for latest features

3. **Differential Updates**
   - Already supported via .blockmap files
   - Reduces download size for small changes

4. **Update History**
   - Show changelog in notification
   - Display version history
   - Rollback to previous version

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [electron-builder Publishing](https://www.electron.build/configuration/publish)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Semantic Versioning](https://semver.org/)

## Support

For issues or questions about auto-updates:
1. Check the logs in `%APPDATA%/Lumina/logs/`
2. Review this guide
3. Check electron-updater documentation
4. Open an issue on GitHub

