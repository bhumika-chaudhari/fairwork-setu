#!/usr/bin/env python3
"""
FairWork Setu - Android Icon Sync Utility
Copies generated adaptive icons and notification assets from android-res/
directly into android/app/src/main/res/ whenever an Android or Capacitor project exists.
"""

import os
import shutil
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SOURCE_RES = os.path.join(PROJECT_ROOT, "android-res")
TARGET_RES = os.path.join(PROJECT_ROOT, "android", "app", "src", "main", "res")


def sync_icons():
    if not os.path.exists(SOURCE_RES):
        print(f"Error: Source icons directory {SOURCE_RES} does not exist.")
        sys.exit(1)

    if not os.path.exists(TARGET_RES):
        print(f"Note: Android app target directory {TARGET_RES} not found.")
        print(f"Assets are ready in {SOURCE_RES} and will be copied upon initializing Android/Capacitor.")
        return

    print(f"Syncing Android launcher and notification icons from {SOURCE_RES} to {TARGET_RES}...")
    for root, dirs, files in os.walk(SOURCE_RES):
        rel_path = os.path.relpath(root, SOURCE_RES)
        dest_dir = os.path.join(TARGET_RES, rel_path)
        os.makedirs(dest_dir, exist_ok=True)
        for f in files:
            src_file = os.path.join(root, f)
            dest_file = os.path.join(dest_dir, f)
            shutil.copy2(src_file, dest_file)
            print(f"  Copied {rel_path}/{f}")

    print("Android assets synced successfully.")


if __name__ == "__main__":
    sync_icons()
