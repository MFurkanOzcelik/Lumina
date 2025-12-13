#!/usr/bin/env python3
"""
Create high-resolution icons from existing logo
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow library not found!")
    print("Please install it with: pip install Pillow")
    sys.exit(1)


def upscale_and_save(input_path, output_path, target_size):
    """Upscale image to target size with high quality"""
    try:
        print(f"Opening: {input_path}")
        img = Image.open(input_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            print(f"Converting from {img.mode} to RGBA")
            img = img.convert('RGBA')
        
        original_size = img.size
        print(f"Original size: {original_size[0]}x{original_size[1]}")
        
        # Upscale to target size
        print(f"Upscaling to {target_size}x{target_size}...")
        img_upscaled = img.resize((target_size, target_size), Image.Resampling.LANCZOS)
        
        # Save as PNG
        print(f"Saving to: {output_path}")
        img_upscaled.save(output_path, 'PNG', optimize=True)
        
        print(f"[OK] Successfully created: {output_path}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error processing {input_path}: {str(e)}")
        return False


def main():
    """Main function to create high-res icons from existing logo"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    print("=" * 60)
    print("Lumina Icon Upscaling Script")
    print("=" * 60)
    print()
    
    # Source logo
    source_logo = project_root / "public" / "logo.png"
    
    if not source_logo.exists():
        print(f"[ERROR] {source_logo} not found!")
        return
    
    # Create high-res app icon
    print("[1/2] Creating high-resolution app icon...")
    print("-" * 60)
    success1 = upscale_and_save(
        source_logo,
        script_dir / "icon.png",
        target_size=1024
    )
    
    # Create high-res document icon (same as app icon for now)
    print("\n[2/2] Creating high-resolution document icon...")
    print("-" * 60)
    success2 = upscale_and_save(
        source_logo,
        script_dir / "document-icon.png",
        target_size=512
    )
    
    if success1 and success2:
        print("\n" + "=" * 60)
        print("[SUCCESS] Icon creation complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Run: npm run electron:build:win")
        print("2. Your icons will be embedded in the application")
        print()
    else:
        print("\n[ERROR] Some errors occurred during icon creation")


if __name__ == "__main__":
    main()

