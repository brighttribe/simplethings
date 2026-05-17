#!/usr/bin/env python3
"""
Full image migration: parse WP XML exports, download all featured images,
convert to WebP 1500px/80%, upload to Supabase Storage, update DB records.
"""

import urllib.request
import urllib.parse
import json
import io
import os
import xml.etree.ElementTree as ET
from PIL import Image

SUPABASE_URL = "https://alppavbgdnytabijdsca.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHBhdmJnZG55dGFiaWpkc2NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk2MzI4MCwiZXhwIjoyMDk0NTM5MjgwfQ.5MKazZ4G2aNc6-QCr_48X4Z6cfNGsneEVeBiSO9mMi8"

NS = {
    'wp': 'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
}

POSTS_XML  = "/Users/briandempsey/Desktop/simplethingsmadebeautiful.WordPress.2026-05-16.xml"
RECIPES_XML = "/Users/briandempsey/Desktop/simplethingsmadebeautiful.WordPress.2026-05-16 (1).xml"


# ── Supabase helpers ─────────────────────────────────────────────────────────

def sb_get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def sb_patch(table, filter_param, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filter_param}"
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }, method="PATCH")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print(f"    PATCH error {e.code}: {e.read().decode()[:120]}")
        return e.code


# ── Image helpers ─────────────────────────────────────────────────────────────

def download(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read()
    except Exception as e:
        print(f"    ✗ download: {e}")
        return None


def to_webp(raw):
    img = Image.open(io.BytesIO(raw))
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
    elif img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    if img.width > 1500:
        img = img.resize((1500, int(img.height * 1500 / img.width)), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format='WEBP', quality=80)
    return out.getvalue()


def upload(filename, webp_bytes):
    url = f"{SUPABASE_URL}/storage/v1/object/media/{urllib.parse.quote(filename)}"
    req = urllib.request.Request(url, data=webp_bytes, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "image/webp",
        "x-upsert": "true",
    }, method="PUT")
    try:
        with urllib.request.urlopen(req) as r:
            r.read()
        return f"{SUPABASE_URL}/storage/v1/object/public/media/{urllib.parse.quote(filename)}"
    except urllib.error.HTTPError as e:
        print(f"    ✗ upload {e.code}: {e.read().decode()[:120]}")
        return None


cache = {}  # wp_url → supabase_url

def migrate_one(wp_url):
    if wp_url in cache:
        return cache[wp_url]
    basename = os.path.basename(wp_url.split('?')[0])
    name = os.path.splitext(basename)[0]
    filename = f"wp-{name}.webp"
    print(f"    ↓ {basename}", end=" ", flush=True)
    raw = download(wp_url)
    if not raw:
        return None
    try:
        webp = to_webp(raw)
    except Exception as e:
        print(f"SKIP (convert: {e})")
        return None
    new_url = upload(filename, webp)
    if new_url:
        cache[wp_url] = new_url
        print(f"✓ {len(webp)//1024}KB")
    return new_url


# ── XML parsing ───────────────────────────────────────────────────────────────

def parse_xml(path, post_type_filter):
    """Returns list of {title, slug, wp_image_url}."""
    tree = ET.parse(path)
    root = tree.getroot()
    items = root.findall('.//item')

    # Build attachment id → url map
    attach = {}
    for item in items:
        pt = item.find('wp:post_type', NS)
        if pt is not None and pt.text == 'attachment':
            pid = item.find('wp:post_id', NS)
            aurl = item.find('wp:attachment_url', NS)
            if pid is not None and aurl is not None and aurl.text:
                attach[pid.text] = aurl.text

    results = []
    for item in items:
        pt = item.find('wp:post_type', NS)
        if pt is None or pt.text not in post_type_filter:
            continue
        title_el = item.find('title')
        slug_el  = item.find('wp:post_name', NS)
        title = title_el.text if title_el is not None else ''
        slug  = slug_el.text  if slug_el  is not None else ''
        thumb_id = None
        for meta in item.findall('wp:postmeta', NS):
            key = meta.find('wp:meta_key', NS)
            val = meta.find('wp:meta_value', NS)
            if key is not None and key.text == '_thumbnail_id' and val is not None:
                thumb_id = val.text
        img_url = attach.get(thumb_id) if thumb_id else None
        results.append({'title': title, 'slug': slug, 'wp_image_url': img_url})
    return results


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Simple Things — Full Image Migration")
    print("=" * 52)

    updated_posts = 0
    updated_recipes = 0
    skipped = 0

    # ── Blog posts ────────────────────────────────────────────────
    print("\n[Blog Posts]")
    xml_posts = parse_xml(POSTS_XML, {'post'})
    db_posts  = sb_get("blog_posts", "select=id,title,slug,hero_image_url")

    # Match by title
    db_by_title = {p['title'].strip().lower(): p for p in db_posts}
    db_by_slug  = {p['slug']: p for p in db_posts}

    for xp in xml_posts:
        wp_url = xp['wp_image_url']
        if not wp_url:
            print(f"  - \"{xp['title']}\" -- no image in XML, skipping")
            skipped += 1
            continue

        # Find matching DB record
        key = xp['title'].strip().lower()
        db_rec = db_by_title.get(key) or db_by_slug.get(xp['slug'])
        if not db_rec:
            print(f"  ! \"{xp['title']}\" -- not found in DB, skipping")
            skipped += 1
            continue

        print(f"  \"{xp['title']}\"")
        new_url = migrate_one(wp_url)
        if new_url:
            sb_patch("blog_posts", f"id=eq.{db_rec['id']}", {"hero_image_url": new_url})
            updated_posts += 1
            print(f"    v hero_image_url updated")

    # ── Recipes ───────────────────────────────────────────────────
    print("\n[Recipes]")
    xml_recipes = parse_xml(RECIPES_XML, {'recipe', 'wprm-recipe'})
    db_recipes  = sb_get("recipes", "select=id,title,slug,featured_image_url")

    db_r_by_title = {r['title'].strip().lower(): r for r in db_recipes}
    db_r_by_slug  = {r['slug']: r for r in db_recipes}

    for xr in xml_recipes:
        wp_url = xr['wp_image_url']
        if not wp_url:
            print(f"  - \"{xr['title']}\" -- no image in XML, skipping")
            skipped += 1
            continue

        key = xr['title'].strip().lower()
        db_rec = db_r_by_title.get(key) or db_r_by_slug.get(xr['slug'])
        if not db_rec:
            print(f"  ! \"{xr['title']}\" -- not found in DB, skipping")
            skipped += 1
            continue

        print(f"  \"{xr['title']}\"")
        new_url = migrate_one(wp_url)
        if new_url:
            sb_patch("recipes", f"id=eq.{db_rec['id']}", {"featured_image_url": new_url})
            updated_recipes += 1
            print(f"    v featured_image_url updated")

    print(f"\n{'=' * 52}")
    print(f"Images uploaded : {len(cache)}")
    print(f"Posts updated   : {updated_posts}")
    print(f"Recipes updated : {updated_recipes}")
    print(f"Skipped         : {skipped}")


if __name__ == "__main__":
    main()
