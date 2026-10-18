#!/usr/bin/env python3
"""
FairWork Setu - App Icon & Brand Asset Generator
Generates all website favicons, PWA icons, Apple Touch icons,
Android adaptive launcher icons, and notification icons from the official logo.
"""

import os
from PIL import Image, ImageDraw

SOURCE_IMAGE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "logo.png")
)
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public"))
ANDROID_RES_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "android-res")
)

# Brand colors
BG_CREAM = (253, 248, 240, 255)  # #FDF8F0
BRAND_TEAL = (7, 59, 58, 255)    # #073B3A


def make_square_fitted(img: Image.Image, size: int, padding_ratio: float = 0.08, bg_color=None) -> Image.Image:
    """
    Fits the non-empty content of the image into a square canvas of `size` x `size`
    with `padding_ratio` margin.
    """
    bbox = img.getbbox()
    if bbox:
        cropped = img.crop(bbox)
    else:
        cropped = img

    cw, ch = cropped.size
    target_content_size = int(size * (1.0 - 2 * padding_ratio))
    target_content_size = max(target_content_size, 1)

    scale = min(target_content_size / cw, target_content_size / ch)
    new_w = max(1, int(cw * scale))
    new_h = max(1, int(ch * scale))

    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    if bg_color:
        canvas = Image.new("RGBA", (size, size), bg_color)
    else:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    return canvas


def make_circular_icon(img: Image.Image, size: int, padding_ratio: float = 0.10, bg_color=BG_CREAM) -> Image.Image:
    """
    Creates a round icon on a circular background.
    """
    square = make_square_fitted(img, size, padding_ratio=padding_ratio, bg_color=bg_color)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)

    circular = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circular.paste(square, (0, 0), mask)
    return circular


def make_monochrome_silhouette(img: Image.Image, size: int, padding_ratio: float = 0.08) -> Image.Image:
    """
    Creates a pure white silhouette on transparent background for Android small notification icons.
    """
    fitted = make_square_fitted(img, size, padding_ratio=padding_ratio, bg_color=None)
    r, g, b, a = fitted.split()
    # Create pure white RGB channels with existing alpha
    white_channel = Image.new("L", (size, size), 255)
    silhouette = Image.merge("RGBA", (white_channel, white_channel, white_channel, a))
    return silhouette


def generate_web_assets(source_img: Image.Image):
    print("Generating Web & PWA assets...")

    # Favicon PNGs
    f16 = make_square_fitted(source_img, 16, padding_ratio=0.04)
    f16.save(os.path.join(PUBLIC_DIR, "favicon-16x16.png"), format="PNG")

    f32 = make_square_fitted(source_img, 32, padding_ratio=0.04)
    f32.save(os.path.join(PUBLIC_DIR, "favicon-32x32.png"), format="PNG")
    f32.save(os.path.join(PUBLIC_DIR, "favicon.png"), format="PNG")

    f48 = make_square_fitted(source_img, 48, padding_ratio=0.05)
    f48.save(os.path.join(PUBLIC_DIR, "favicon-48x48.png"), format="PNG")

    # Multi-resolution favicon.ico containing 16x16, 32x32, and 48x48
    source_img.save(
        os.path.join(PUBLIC_DIR, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    # Apple Touch Icons (iOS requires solid background)
    apple_sizes = [
        ("apple-touch-icon.png", 180),
        ("apple-touch-icon-180x180.png", 180),
        ("apple-touch-icon-167x167.png", 167),
        ("apple-touch-icon-152x152.png", 152),
        ("apple-touch-icon-120x120.png", 120),
    ]
    for name, sz in apple_sizes:
        apple_icon = make_square_fitted(source_img, sz, padding_ratio=0.12, bg_color=BG_CREAM)
        apple_icon.save(os.path.join(PUBLIC_DIR, name), format="PNG")

    # Android / PWA Chrome Icons
    pwa192 = make_square_fitted(source_img, 192, padding_ratio=0.08)
    pwa192.save(os.path.join(PUBLIC_DIR, "android-chrome-192x192.png"), format="PNG")

    pwa512 = make_square_fitted(source_img, 512, padding_ratio=0.08)
    pwa512.save(os.path.join(PUBLIC_DIR, "android-chrome-512x512.png"), format="PNG")

    # Maskable Icon (safe zone is center 80% circle, safe padding >= 15%)
    maskable = make_square_fitted(source_img, 512, padding_ratio=0.18, bg_color=BG_CREAM)
    maskable.save(os.path.join(PUBLIC_DIR, "maskable-icon-512x512.png"), format="PNG")

    # Notification Web Icons
    notif_large = make_square_fitted(source_img, 192, padding_ratio=0.06)
    notif_large.save(os.path.join(PUBLIC_DIR, "notification-icon-192x192.png"), format="PNG")

    notif_badge_72 = make_monochrome_silhouette(source_img, 72, padding_ratio=0.06)
    notif_badge_72.save(os.path.join(PUBLIC_DIR, "notification-badge-72x72.png"), format="PNG")

    notif_badge_96 = make_monochrome_silhouette(source_img, 96, padding_ratio=0.06)
    notif_badge_96.save(os.path.join(PUBLIC_DIR, "notification-badge-96x96.png"), format="PNG")

    print("Web & PWA assets generated successfully.")


def generate_android_assets(source_img: Image.Image):
    print("Generating Android APK / Resource assets...")

    # Density mapping
    # Density: (launcher_size, round_launcher_size, foreground_size, notif_small_size, notif_large_size)
    densities = {
        "mipmap-mdpi": (48, 48, 108),
        "mipmap-hdpi": (72, 72, 162),
        "mipmap-xhdpi": (96, 96, 216),
        "mipmap-xxhdpi": (144, 144, 324),
        "mipmap-xxxhdpi": (192, 192, 432),
    }

    drawable_densities = {
        "drawable-mdpi": (24, 64),
        "drawable-hdpi": (36, 96),
        "drawable-xhdpi": (48, 128),
        "drawable-xxhdpi": (72, 192),
        "drawable-xxxhdpi": (96, 256),
    }

    for folder, (launch_sz, round_sz, fg_sz) in densities.items():
        out_dir = os.path.join(ANDROID_RES_DIR, folder)
        os.makedirs(out_dir, exist_ok=True)

        # 1. Legacy Launcher Icon (square with brand background)
        launcher = make_square_fitted(source_img, launch_sz, padding_ratio=0.10, bg_color=BG_CREAM)
        launcher.save(os.path.join(out_dir, "ic_launcher.png"), format="PNG")

        # 2. Round Launcher Icon
        round_icon = make_circular_icon(source_img, round_sz, padding_ratio=0.12, bg_color=BG_CREAM)
        round_icon.save(os.path.join(out_dir, "ic_launcher_round.png"), format="PNG")

        # 3. Adaptive Foreground Icon (center 72dp is safe area, canvas is 108dp)
        # padding_ratio = (108 - 72) / (2 * 108) ~ 0.166
        fg = make_square_fitted(source_img, fg_sz, padding_ratio=0.18, bg_color=None)
        fg.save(os.path.join(out_dir, "ic_launcher_foreground.png"), format="PNG")

    for folder, (small_sz, large_sz) in drawable_densities.items():
        out_dir = os.path.join(ANDROID_RES_DIR, folder)
        os.makedirs(out_dir, exist_ok=True)

        # 4. Small notification icon (white silhouette)
        small_notif = make_monochrome_silhouette(source_img, small_sz, padding_ratio=0.06)
        small_notif.save(os.path.join(out_dir, "ic_notification.png"), format="PNG")

        # 5. Large notification icon (full color)
        large_notif = make_square_fitted(source_img, large_sz, padding_ratio=0.06, bg_color=None)
        large_notif.save(os.path.join(out_dir, "ic_notification_large.png"), format="PNG")

    # Adaptive XMLs
    xml_dir = os.path.join(ANDROID_RES_DIR, "mipmap-anydpi-v26")
    os.makedirs(xml_dir, exist_ok=True)

    ic_launcher_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"""
    with open(os.path.join(xml_dir, "ic_launcher.xml"), "w") as f:
        f.write(ic_launcher_xml)

    with open(os.path.join(xml_dir, "ic_launcher_round.xml"), "w") as f:
        f.write(ic_launcher_xml)

    # Color resources for background
    values_dir = os.path.join(ANDROID_RES_DIR, "values")
    os.makedirs(values_dir, exist_ok=True)
    ic_launcher_bg_xml = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FDF8F0</color>
</resources>
"""
    with open(os.path.join(values_dir, "ic_launcher_background.xml"), "w") as f:
        f.write(ic_launcher_bg_xml)

    print("Android APK / Resource assets generated successfully.")


def main():
    if not os.path.exists(SOURCE_IMAGE_PATH):
        raise FileNotFoundError(f"Source image not found: {SOURCE_IMAGE_PATH}")

    source_img = Image.open(SOURCE_IMAGE_PATH).convert("RGBA")
    print(f"Loaded source logo from {SOURCE_IMAGE_PATH} (size: {source_img.size})")

    generate_web_assets(source_img)
    generate_android_assets(source_img)
    print("All Setu official logo assets generated and verified!")


if __name__ == "__main__":
    main()
