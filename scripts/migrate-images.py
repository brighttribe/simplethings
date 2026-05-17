#!/usr/bin/env python3
"""
Migrate WP images from simplethingsmadebeautiful.com to Supabase Storage.
Downloads, converts to WebP 1500px/80%, uploads, then updates post/recipe URLs.
"""

import urllib.request
import urllib.parse
import json
import re
import io
import os
from PIL import Image

SUPABASE_URL = "https://alppavbgdnytabijdsca.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHBhdmJnZG55dGFiaWpkc2NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk2MzI4MCwiZXhwIjoyMDk0NTM5MjgwfQ.5MKazZ4G2aNc6-QCr_48X4Z6cfNGsneEVeBiSO9mMi8"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}


def supabase_get(path, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{path}?{params}"
    req = urllib.request.Request(url, headers={**HEADERS, "Prefer": ""})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def supabase_patch(path, filter_param, data):
    url = f"{SUPABASE_URL}/rest/v1/{path}?{filter_param}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={**HEADERS, "Prefer": "return=minimal"}, method="PATCH")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        print(f"    PATCH error: {e.code} {e.read().decode()[:100]}")
        return e.code


def download_image(url):
    """Download an image from a URL. Returns bytes or None on failure."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read()
    except Exception as e:
        print(f"    Download failed: {e}")
        return None


def convert_to_webp(image_bytes):
    """Convert image bytes to WebP at max 1500px wide, 80% quality."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    if img.width > 1500:
        ratio = 1500 / img.width
        img = img.resize((1500, int(img.height * ratio)), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format='WEBP', quality=80)
    return out.getvalue()


def upload_to_supabase(filename, webp_bytes):
    """Upload WebP bytes to Supabase Storage. Returns public URL or None."""
    url = f"{SUPABASE_URL}/storage/v1/object/media/{urllib.parse.quote(filename)}"
    req = urllib.request.Request(url, data=webp_bytes, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "image/webp",
        "x-upsert": "true",
    }, method="PUT")
    try:
        with urllib.request.urlopen(req) as resp:
            resp.read()
        return f"{SUPABASE_URL}/storage/v1/object/public/media/{urllib.parse.quote(filename)}"
    except urllib.error.HTTPError as e:
        print(f"    Upload error: {e.code} {e.read().decode()[:100]}")
        return None


def extract_wp_image_urls(html):
    """Extract all WP image URLs from HTML content."""
    if not html:
        return []
    return re.findall(
        r'https://simplethingsmadebeautiful\.com/wp-content/uploads/[^\s"\'<>]+\.(?:jpg|jpeg|png|gif|webp)',
        html, re.IGNORECASE
    )


def migrate_image(wp_url, url_map):
    """Download, convert, upload one WP image. Updates url_map in place."""
    if wp_url in url_map:
        return url_map[wp_url]

    basename = os.path.basename(wp_url.split('?')[0])
    name_no_ext = os.path.splitext(basename)[0]
    filename = f"wp-{name_no_ext}.webp"

    print(f"  → {basename}", end=" ", flush=True)

    image_bytes = download_image(wp_url)
    if not image_bytes:
        print("SKIP (download failed)")
        return None

    try:
        webp_bytes = convert_to_webp(image_bytes)
    except Exception as e:
        print(f"SKIP (convert failed: {e})")
        return None

    new_url = upload_to_supabase(filename, webp_bytes)
    if new_url:
        url_map[wp_url] = new_url
        print(f"✓ ({len(webp_bytes) // 1024}KB webp)")
    else:
        print("SKIP (upload failed)")

    return new_url


def main():
    print("Simple Things — WP Image Migration")
    print("=" * 50)

    url_map = {}  # old WP url → new Supabase url
    migrated = 0

    # ── Blog posts ────────────────────────────────────────────────
    print("\n[Blog Posts]")
    posts = supabase_get("blog_posts", "select=id,hero_image_url,content_html")

    for post in posts:
        post_id = post["id"]
        content = post.get("content_html") or ""
        hero = post.get("hero_image_url") or ""

        # Collect all WP URLs from this post
        wp_urls = set()
        if hero and "simplethingsmadebeautiful.com" in hero:
            wp_urls.add(hero)
        for u in extract_wp_image_urls(content):
            wp_urls.add(u)

        if not wp_urls:
            continue

        print(f"\nPost: {post_id[:8]}... ({len(wp_urls)} images)")
        for url in wp_urls:
            migrate_image(url, url_map)

        # Update post
        new_hero = url_map.get(hero, hero) if hero else hero
        new_content = content
        for old, new in url_map.items():
            new_content = new_content.replace(old, new)

        updates = {}
        if new_hero != hero:
            updates["hero_image_url"] = new_hero
        if new_content != content:
            updates["content_html"] = new_content

        if updates:
            supabase_patch("blog_posts", f"id=eq.{post_id}", updates)
            migrated += 1
            print(f"  ✓ Updated post record")

    # ── Recipes ───────────────────────────────────────────────────
    print("\n[Recipes]")
    recipes = supabase_get("recipes", "select=id,featured_image_url")

    for recipe in recipes:
        recipe_id = recipe["id"]
        featured = recipe.get("featured_image_url") or ""

        if not featured or "simplethingsmadebeautiful.com" not in featured:
            continue

        print(f"\nRecipe: {recipe_id[:8]}... (1 image)")
        migrate_image(featured, url_map)

        new_featured = url_map.get(featured, featured)
        if new_featured != featured:
            supabase_patch("recipes", f"id=eq.{recipe_id}", {"featured_image_url": new_featured})
            migrated += 1
            print(f"  ✓ Updated recipe record")

    print(f"\n{'=' * 50}")
    print(f"Done. {len(url_map)} images uploaded, {migrated} records updated.")


if __name__ == "__main__":
    main()
