# Icon Setup Guide for Lumina

## Overview
This guide explains how to set up custom icons for the Lumina application and its `.lum` file association.

## Icon Requirements

### Application Icon (Main App)
- **Format**: PNG (recommended) or ICO/ICNS
- **Size**: 512x512px or 1024x1024px (square)
- **Aspect Ratio**: Must be 1:1 (square) to prevent distortion
- **File Location**: `build/icon.png`

### Document Icon (.lum files)
- **Format**: PNG (recommended) or ICO
- **Size**: 256x256px or 512x512px (square)
- **Aspect Ratio**: Must be 1:1 (square)
- **File Location**: `build/document-icon.png`

## Setup Instructions

### Step 1: Prepare Your Images

1. **App Icon (Image 1)**:
   - Open the image in an image editor (Photoshop, GIMP, Paint.NET, etc.)
   - Ensure the image is square (1:1 aspect ratio)
   - If the image is not square, add transparent padding to make it square
   - Resize to 512x512px or 1024x1024px
   - Export as PNG with transparency
   - Save as: `build/icon.png`

2. **Document Icon (Image 2)**:
   - Follow the same process as above
   - Resize to 512x512px
   - Save as: `build/document-icon.png`

### Step 2: Convert to Platform-Specific Formats (Optional)

electron-builder will automatically generate platform-specific icons (.ico for Windows, .icns for macOS) from the PNG files. However, if you want more control:

#### For Windows (.ico):
Use an online converter or tool like:
- https://convertio.co/png-ico/
- https://icoconvert.com/
- Or use ImageMagick: `magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`

#### For macOS (.icns):
Use an online converter or:
- https://cloudconvert.com/png-to-icns
- Or use `iconutil` on macOS

### Step 3: Update package.json

The `package.json` has been configured to use:
- `build/icon.png` for the main application icon
- `build/document-icon.png` for `.lum` file associations

### Step 4: Build the Application

Run the build command:
```bash
npm run electron:build:win
```

electron-builder will automatically:
1. Generate platform-specific icons from the PNG files
2. Embed the app icon in the executable
3. Register the document icon for `.lum` file associations

## Troubleshooting

### Icon Appears Squished or Distorted
- **Cause**: The source image is not square (1:1 aspect ratio)
- **Solution**: Add transparent padding to make the image perfectly square before saving

### Icon Not Updating After Build
- **Cause**: Windows caches icons
- **Solution**: 
  1. Delete the old executable
  2. Clear icon cache: `ie4uinit.exe -show` or restart Windows Explorer
  3. Rebuild the application

### .lum Files Not Showing Custom Icon
- **Cause**: File association not registered or icon path incorrect
- **Solution**:
  1. Uninstall the old version completely
  2. Reinstall using the new installer
  3. On Windows, you may need to restart Explorer or log out/in

## Quick Reference

### Current Icon Configuration (package.json)

```json
"build": {
  "win": {
    "icon": "build/icon.png"
  },
  "mac": {
    "icon": "build/icon.png"
  },
  "linux": {
    "icon": "build/icon.png"
  },
  "fileAssociations": [
    {
      "ext": "lum",
      "icon": "build/document-icon.png"
    }
  ]
}
```

## Best Practices

1. **Use PNG with Transparency**: Provides the best quality and flexibility
2. **Use High Resolution**: Start with 1024x1024px and let electron-builder downscale
3. **Maintain Aspect Ratio**: Always use square images (1:1 ratio)
4. **Test on All Platforms**: Icons may look different on Windows, macOS, and Linux
5. **Keep Original Files**: Store the original high-res images for future updates

## Tools Recommended

- **Image Editing**: GIMP (free), Photoshop, Affinity Designer
- **Icon Conversion**: ImageMagick, online converters
- **Icon Validation**: IconWorkshop, IcoFX

