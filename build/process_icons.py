#!/usr/bin/env python3
"""
Icon Processing Script for Lumina
This script helps convert and prepare icons for electron-builder
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow library not found!")
    print("Please install it with: pip install Pillow")
    sys.exit(1)


def make_square_with_padding(image):
    """Add transparent padding to make image square while maintaining aspect ratio"""
    width, height = image.size
    
    # If already square, return as is
    if width == height:
        return image
    
    # Determine the size of the square canvas
    max_dimension = max(width, height)
    
    # Create a new square image with transparent background
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    square_image = Image.new('RGBA', (max_dimension, max_dimension), (0, 0, 0, 0))
    
    # Calculate position to paste the original image (centered)
    paste_x = (max_dimension - width) // 2
    paste_y = (max_dimension - height) // 2
    
    # Paste the original image onto the square canvas
    square_image.paste(image, (paste_x, paste_y), image if image.mode == 'RGBA' else None)
    
    return square_image


def process_icon(input_path, output_path, target_size=512):
    """
    Process an icon image:
    1. Make it square with transparent padding if needed
    2. Resize to target size
    3. Save as PNG with transparency
    """
    try:
        # Open the image
        print(f"Opening: {input_path}")
        img = Image.open(input_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            print(f"Converting from {img.mode} to RGBA")
            img = img.convert('RGBA')
        
        original_size = img.size
        print(f"Original size: {original_size[0]}x{original_size[1]}")
        
        # Make square with padding
        if original_size[0] != original_size[1]:
            print("Image is not square, adding transparent padding...")
            img = make_square_with_padding(img)
            print(f"New size after padding: {img.size[0]}x{img.size[1]}")
        
        # Resize to target size
        if img.size[0] != target_size:
            print(f"Resizing to {target_size}x{target_size}...")
            img = img.resize((target_size, target_size), Image.Resampling.LANCZOS)
        
        # Save as PNG
        print(f"Saving to: {output_path}")
        img.save(output_path, 'PNG', optimize=True)
        
        print(f"✓ Successfully processed: {output_path}")
        return True
        
    except Exception as e:
        print(f"✗ Error processing {input_path}: {str(e)}")
        return False


def main():
    """Main function to process both icons"""
    script_dir = Path(__file__).parent
    
    print("=" * 60)
    print("Lumina Icon Processing Script")
    print("=" * 60)
    print()
    
    # Check if source images exist
    # Users should manually save the attached images as these filenames first
    app_icon_source = script_dir / "app-icon-source.png"
    doc_icon_source = script_dir / "doc-icon-source.png"
    
    if not app_icon_source.exists():
        print(f"⚠ Warning: {app_icon_source} not found!")
        print("Please save Image 1 (App Logo) as 'app-icon-source.png' in the build/ directory")
        print()
    
    if not doc_icon_source.exists():
        print(f"⚠ Warning: {doc_icon_source} not found!")
        print("Please save Image 2 (Document Logo) as 'doc-icon-source.png' in the build/ directory")
        print()
    
    if not app_icon_source.exists() and not doc_icon_source.exists():
        print("No source images found. Exiting.")
        return
    
    # Process app icon
    if app_icon_source.exists():
        print("\n[1/2] Processing Application Icon...")
        print("-" * 60)
        success = process_icon(
            app_icon_source,
            script_dir / "icon.png",
            target_size=1024  # High resolution for best quality
        )
        if success:
            print("✓ Application icon ready!")
    
    # Process document icon
    if doc_icon_source.exists():
        print("\n[2/2] Processing Document Icon...")
        print("-" * 60)
        success = process_icon(
            doc_icon_source,
            script_dir / "document-icon.png",
            target_size=512
        )
        if success:
            print("✓ Document icon ready!")
    
    print("\n" + "=" * 60)
    print("Icon processing complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run: npm run electron:build:win")
    print("2. Your new icons will be embedded in the application")
    print()


if __name__ == "__main__":
    main()

