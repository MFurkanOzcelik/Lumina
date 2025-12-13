# Icon Assets Directory

## Required Files

Please save your icon images in this directory with the following names:

### 1. Application Icon (Image 1 - Main App Logo)
- **Filename**: `icon.png`
- **Requirements**: 
  - Size: 512x512px or 1024x1024px
  - Format: PNG with transparency
  - Aspect Ratio: 1:1 (perfectly square)
  - Content: Your main application logo

### 2. Document Icon (Image 2 - .lum File Icon)
- **Filename**: `document-icon.png`
- **Requirements**:
  - Size: 512x512px
  - Format: PNG with transparency
  - Aspect Ratio: 1:1 (perfectly square)
  - Content: Your .lum file document logo

## How to Prepare Icons

### If Your Image is Not Square:

1. Open the image in an image editor (Paint.NET, GIMP, Photoshop, etc.)
2. Check the dimensions (e.g., if it's 400x300, it's not square)
3. Create a new canvas that is square (use the larger dimension, e.g., 400x400)
4. Center your original image on the transparent canvas
5. This adds transparent padding to make it square
6. Resize to 512x512px or 1024x1024px
7. Export as PNG

### Quick Online Tools:

- **Make Square**: https://www.iloveimg.com/crop-image
- **Resize**: https://www.iloveimg.com/resize-image
- **Add Padding**: https://www.imgonline.com.ua/eng/add-transparent-border.php

## After Saving Icons

Once you've saved both `icon.png` and `document-icon.png` in this directory:

1. Run: `npm run electron:build:win`
2. electron-builder will automatically generate platform-specific icons
3. Your application and .lum files will use the new icons

## Current Status

- [ ] icon.png (Application Icon) - **REQUIRED**
- [ ] document-icon.png (Document Icon) - **REQUIRED**

Please save both images before building the application.

