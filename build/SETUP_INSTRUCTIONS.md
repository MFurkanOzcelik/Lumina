# Icon Setup Instructions - IMPORTANT

## ⚠️ ACTION REQUIRED

You have attached two images for the icons. Please follow these steps to complete the setup:

## Step 1: Save Your Attached Images

### Image 1 - Application Icon (Main App Logo)
The first image you attached should be saved as:
- **Location**: `build/app-icon-source.png` or `build/app-icon-source.jpg`
- **This will become**: The main Lumina application icon

### Image 2 - Document Icon (.lum File Icon)  
The second image you attached should be saved as:
- **Location**: `build/doc-icon-source.png` or `build/doc-icon-source.jpg`
- **This will become**: The icon for all `.lum` files

## Step 2: Process the Icons

### Option A: Automatic Processing (Recommended)

If you have Python and Pillow installed:

```bash
# Install Pillow if needed
pip install Pillow

# Run the processing script
python build/process_icons.py
```

This will automatically:
- Make both images square (adding transparent padding if needed)
- Resize to optimal dimensions
- Save as `icon.png` and `document-icon.png`

### Option B: Manual Processing

If you prefer to process manually:

1. **For Each Image**:
   - Open in an image editor (GIMP, Photoshop, Paint.NET, etc.)
   - Check if it's square (width = height)
   - If not square, add transparent padding to make it square
   - Resize to 512x512px or 1024x1024px
   - Export as PNG with transparency

2. **Save As**:
   - App icon → `build/icon.png`
   - Document icon → `build/document-icon.png`

### Option C: Use Online Tools

1. **Make Square**: https://www.iloveimg.com/crop-image
   - Upload your image
   - Select "Custom" aspect ratio
   - Set to 1:1 (square)
   - Add padding if needed
   
2. **Resize**: https://www.iloveimg.com/resize-image
   - Resize to 512x512 or 1024x1024
   
3. **Convert to PNG**: https://www.iloveimg.com/convert-to-png
   - Ensure transparency is preserved

## Step 3: Build the Application

Once both `icon.png` and `document-icon.png` are in the `build/` directory:

```bash
npm run electron:build:win
```

electron-builder will automatically:
- Generate Windows .ico files
- Generate macOS .icns files  
- Embed icons in the executable
- Register the document icon for .lum files

## Step 4: Verify

After building:
1. Check the executable icon in File Explorer
2. Create or open a .lum file to verify the document icon
3. If icons don't update, clear Windows icon cache and rebuild

## Important Notes

### Aspect Ratio is Critical
- Icons MUST be square (1:1 ratio) to prevent distortion
- If your image is not square, add transparent padding
- Do NOT stretch or squish the image to make it square

### Current Configuration

The `package.json` has been updated to use:
```json
"win": {
  "icon": "build/icon.png"
},
"fileAssociations": [{
  "ext": "lum",
  "icon": "build/document-icon.png"
}]
```

## Quick Checklist

- [ ] Save Image 1 as `build/app-icon-source.png` (or .jpg)
- [ ] Save Image 2 as `build/doc-icon-source.png` (or .jpg)
- [ ] Run `python build/process_icons.py` OR manually process
- [ ] Verify `build/icon.png` exists (1024x1024px, square)
- [ ] Verify `build/document-icon.png` exists (512x512px, square)
- [ ] Run `npm run electron:build:win`
- [ ] Test the new icons

## Need Help?

See `build/ICON_SETUP_GUIDE.md` for detailed information about icon requirements and troubleshooting.

