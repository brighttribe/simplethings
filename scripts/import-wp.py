#!/usr/bin/env python3
"""
WordPress XML → Supabase import script for Simple Things Made Beautiful.
Run: python3 scripts/import-wp.py
"""

import xml.etree.ElementTree as ET
import json
import re
import urllib.request
import urllib.parse
import sys
from datetime import datetime, timezone

SUPABASE_URL = "https://alppavbgdnytabijdsca.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHBhdmJnZG55dGFiaWpkc2NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk2MzI4MCwiZXhwIjoyMDk0NTM5MjgwfQ.5MKazZ4G2aNc6-QCr_48X4Z6cfNGsneEVeBiSO9mMi8"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

NS = {
    "content": "http://purl.org/rss/1.0/modules/content/",
    "wp": "http://wordpress.org/export/1.2/",
    "dc": "http://purl.org/dc/elements/1.1/",
}

POSTS_FILE = "/Users/briandempsey/Desktop/simplethingsmadebeautiful.WordPress.2026-05-16.xml"
RECIPES_FILE = "/Users/briandempsey/Desktop/simplethingsmadebeautiful.WordPress.2026-05-16 (1).xml"


# ---------------------------------------------------------------------------
# PHP serialized string parser (handles arrays of strings/ints only)
# ---------------------------------------------------------------------------

def php_unserialize(s):
    if not s:
        return None
    pos = [0]

    def read_until(ch):
        start = pos[0]
        idx = s.index(ch, start)
        result = s[start:idx]
        pos[0] = idx + 1
        return result

    def read_value():
        if pos[0] >= len(s):
            return None
        typ = s[pos[0]]
        pos[0] += 2  # skip "X:"

        if typ == 'i':
            val = read_until(';')
            return int(val)
        elif typ == 'd':
            val = read_until(';')
            return float(val)
        elif typ == 'b':
            val = read_until(';')
            return val == '1'
        elif typ == 's':
            length = int(read_until(':'))
            pos[0] += 1  # skip opening "
            val = s[pos[0]:pos[0] + length]
            pos[0] += length + 2  # skip closing ";
            return val
        elif typ == 'N':
            return None
        elif typ == 'a':
            count = int(read_until(':'))
            pos[0] += 1  # skip {
            result = {}
            for _ in range(count):
                key = read_value()
                value = read_value()
                result[key] = value
            pos[0] += 1  # skip }
            return result
        else:
            return None

    try:
        return read_value()
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def supabase_post(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ERROR posting to {table}: {e.code} {err[:200]}")
        return None


def supabase_get(table, params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers={**HEADERS, "Prefer": ""})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def strip_shortcodes(html):
    """Strip WP page builder shortcodes, keep text content inside vc_column_text."""
    if not html:
        return ""
    # Extract text from [vc_column_text]...[/vc_column_text] blocks
    blocks = re.findall(r'\[vc_column_text[^\]]*\](.*?)\[/vc_column_text\]', html, re.DOTALL)
    if blocks:
        return "\n".join(blocks).strip()
    # Fallback: strip all [shortcode] tags
    cleaned = re.sub(r'\[/?[a-z_][^\]]*\]', '', html)
    return cleaned.strip()


def parse_date(date_str):
    """Parse WP date string to ISO format."""
    if not date_str or date_str.startswith("0000"):
        return None
    try:
        dt = datetime.strptime(date_str[:19], "%Y-%m-%d %H:%M:%S")
        return dt.replace(tzinfo=timezone.utc).isoformat()
    except Exception:
        return None


def parse_pub_date(date_str):
    """Parse RSS pubDate format."""
    if not date_str:
        return None
    try:
        # 'Tue, 15 Jul 2014 16:40:53 +0000'
        dt = datetime.strptime(date_str[:25].strip(), "%a, %d %b %Y %H:%M:%S")
        return dt.replace(tzinfo=timezone.utc).isoformat()
    except Exception:
        return None


def make_unique_slug(base_slug, existing_slugs):
    slug = base_slug
    counter = 2
    while slug in existing_slugs:
        slug = f"{base_slug}-{counter}"
        counter += 1
    existing_slugs.add(slug)
    return slug


# ---------------------------------------------------------------------------
# Import blog posts
# ---------------------------------------------------------------------------

def import_posts():
    print("\n=== Importing Blog Posts ===")
    tree = ET.parse(POSTS_FILE)
    root = tree.getroot()
    channel = root.find("channel")

    # Get existing slugs to avoid conflicts
    existing = supabase_get("blog_posts", "select=slug")
    used_slugs = {r["slug"] for r in existing}

    imported = 0
    skipped = 0

    for item in channel.findall("item"):
        post_type = item.find("wp:post_type", NS)
        if post_type is None or post_type.text != "post":
            continue

        wp_status_el = item.find("wp:status", NS)
        wp_status = wp_status_el.text if wp_status_el is not None else "draft"
        if wp_status not in ("publish", "draft"):
            skipped += 1
            continue

        title = item.findtext("title") or "Untitled"
        slug_el = item.find("wp:post_name", NS)
        raw_slug = (slug_el.text or "").strip() if slug_el is not None else ""
        if not raw_slug:
            raw_slug = re.sub(r"[^a-z0-9-]", "-", title.lower()).strip("-")
        slug = make_unique_slug(raw_slug, used_slugs)

        content_el = item.find("content:encoded", NS)
        raw_content = content_el.text if content_el is not None else ""
        content_html = strip_shortcodes(raw_content)

        pub_date = None
        post_date_el = item.find("wp:post_date_gmt", NS)
        if post_date_el is not None and post_date_el.text:
            pub_date = parse_date(post_date_el.text)
        if not pub_date:
            pub_date = parse_pub_date(item.findtext("pubDate") or "")

        status = "published" if wp_status == "publish" else "draft"

        # Categories (domain="category") and tags (domain="post_tag")
        wp_categories = []
        wp_tags = []
        for cat in item.findall("category"):
            domain = cat.get("domain", "")
            name = cat.text or ""
            nicename = cat.get("nicename", "")
            if domain == "category":
                wp_categories.append((name, nicename))
            elif domain == "post_tag":
                wp_tags.append((name, nicename))

        print(f"  Importing post: {title}")
        result = supabase_post("blog_posts", {
            "title": title,
            "slug": slug,
            "content_html": content_html if content_html else None,
            "status": status,
            "published_at": pub_date if status == "published" else None,
        })

        if result and len(result) > 0:
            post_id = result[0]["id"]
            import_post_categories(post_id, wp_categories)
            import_post_tags(post_id, wp_tags)
            imported += 1
        else:
            skipped += 1

    print(f"  Done: {imported} imported, {skipped} skipped")


def get_or_create_category(name, slug, existing_cache):
    if slug in existing_cache:
        return existing_cache[slug]
    result = supabase_post("categories", {"name": name, "slug": slug})
    if result and len(result) > 0:
        cat_id = result[0]["id"]
        existing_cache[slug] = cat_id
        return cat_id
    return None


def get_or_create_tag(name, slug, existing_cache):
    if slug in existing_cache:
        return existing_cache[slug]
    result = supabase_post("blog_tags", {"name": name, "slug": slug})
    if result and len(result) > 0:
        tag_id = result[0]["id"]
        existing_cache[slug] = tag_id
        return tag_id
    return None


_category_cache = {}
_tag_cache = {}


def import_post_categories(post_id, wp_categories):
    for name, slug in wp_categories:
        if not slug:
            continue
        cat_id = get_or_create_category(name, slug, _category_cache)
        if cat_id:
            supabase_post("blog_post_categories", {"post_id": post_id, "category_id": cat_id})


def import_post_tags(post_id, wp_tags):
    for name, slug in wp_tags:
        if not slug:
            continue
        tag_id = get_or_create_tag(name, slug, _tag_cache)
        if tag_id:
            supabase_post("blog_post_tags", {"post_id": post_id, "tag_id": tag_id})


# ---------------------------------------------------------------------------
# Import recipes
# ---------------------------------------------------------------------------

_recipe_category_cache = {}


def get_or_create_recipe_category(name, slug):
    if slug in _recipe_category_cache:
        return _recipe_category_cache[slug]
    result = supabase_post("recipe_categories", {"name": name, "slug": slug})
    if result and len(result) > 0:
        cat_id = result[0]["id"]
        _recipe_category_cache[slug] = cat_id
        return cat_id
    return None


def parse_ingredients(serialized):
    """Parse PHP serialized ingredients into [{amount, unit, ingredient, notes}] list."""
    data = php_unserialize(serialized)
    if not data or not isinstance(data, dict):
        return []
    result = []
    def sort_key(x):
        if x is None:
            return (0, 0, "")
        if isinstance(x, int):
            return (0, x, "")
        return (1, 0, str(x))

    for key in sorted(data.keys(), key=sort_key):
        item = data[key]
        if not isinstance(item, dict):
            continue
        amount = str(item.get("amount", "") or "").strip()
        unit = str(item.get("unit", "") or "").strip()
        ingredient = str(item.get("ingredient", "") or "").strip()
        notes = str(item.get("notes", "") or "").strip()
        if not ingredient:
            continue
        parts = []
        if amount:
            parts.append(amount)
        if unit:
            parts.append(unit)
        text = " ".join(parts + [ingredient])
        if notes:
            text += f", {notes}"
        result.append({"text": text})
    return result


def parse_instructions(serialized):
    """Parse PHP serialized instructions into [{text}] list."""
    data = php_unserialize(serialized)
    if not data or not isinstance(data, dict):
        return []
    result = []
    def sort_key(x):
        if x is None:
            return (0, 0, "")
        if isinstance(x, int):
            return (0, x, "")
        return (1, 0, str(x))
    for key in sorted(data.keys(), key=sort_key):
        item = data[key]
        if not isinstance(item, dict):
            continue
        description = str(item.get("description", "")).strip()
        if description:
            result.append({"text": description})
    return result


def import_recipes():
    print("\n=== Importing Recipes ===")
    tree = ET.parse(RECIPES_FILE)
    root = tree.getroot()
    channel = root.find("channel")

    existing = supabase_get("recipes", "select=slug")
    used_slugs = {r["slug"] for r in existing}

    imported = 0
    skipped = 0
    seen_titles = set()

    for item in channel.findall("item"):
        post_type = item.find("wp:post_type", NS)
        if post_type is None or post_type.text != "recipe":
            continue

        wp_status_el = item.find("wp:status", NS)
        wp_status = wp_status_el.text if wp_status_el is not None else "draft"

        title = item.findtext("title") or "Untitled"

        # Skip duplicate titles (WP had Cream Cheese Icing and Brandied Carrots twice)
        if title in seen_titles:
            print(f"  Skipping duplicate: {title}")
            skipped += 1
            continue
        seen_titles.add(title)

        # Gather meta fields
        meta = {}
        for m in item.findall("wp:postmeta", NS):
            key_el = m.find("wp:meta_key", NS)
            val_el = m.find("wp:meta_value", NS)
            if key_el is not None and val_el is not None:
                meta[key_el.text or ""] = val_el.text or ""

        slug_el = item.find("wp:post_name", NS)
        raw_slug = (slug_el.text or "").strip() if slug_el is not None else ""
        if not raw_slug:
            raw_slug = re.sub(r"[^a-z0-9-]", "-", title.lower()).strip("-")
        slug = make_unique_slug(raw_slug, used_slugs)

        description = meta.get("recipe_description", "").strip()
        prep_time = meta.get("recipe_prep_time", "").strip()
        prep_text = meta.get("recipe_prep_time_text", "mins").strip().rstrip(".")
        cook_time = meta.get("recipe_cook_time", "").strip()
        cook_text = meta.get("recipe_cook_time_text", "mins").strip().rstrip(".")
        servings = meta.get("recipe_servings", "").strip()
        servings_type = meta.get("recipe_servings_type", "").strip()

        prep_str = f"{prep_time} {prep_text}".strip() if prep_time else None
        cook_str = f"{cook_time} {cook_text}".strip() if cook_time else None
        servings_str = f"{servings} {servings_type}".strip() if servings else None

        ingredients = parse_ingredients(meta.get("recipe_ingredients", ""))
        instructions = parse_instructions(meta.get("recipe_instructions", ""))

        pub_date = None
        post_date_el = item.find("wp:post_date_gmt", NS)
        if post_date_el is not None and post_date_el.text:
            pub_date = parse_date(post_date_el.text)
        if not pub_date:
            pub_date = parse_pub_date(item.findtext("pubDate") or "")

        status = "published" if wp_status == "publish" else "draft"

        print(f"  Importing recipe: {title} ({len(ingredients)} ingredients, {len(instructions)} steps)")

        result = supabase_post("recipes", {
            "title": title,
            "slug": slug,
            "description": description if description else None,
            "prep_time": prep_str,
            "cook_time": cook_str,
            "servings": servings_str,
            "ingredients": ingredients,
            "instructions": instructions,
            "status": status,
            "published_at": pub_date if status == "published" else None,
        })

        if result and len(result) > 0:
            recipe_id = result[0]["id"]
            # Import recipe categories from WP categories
            for cat_el in item.findall("category"):
                domain = cat_el.get("domain", "")
                if domain == "category":
                    cat_name = cat_el.text or ""
                    cat_slug = cat_el.get("nicename", "")
                    if cat_slug:
                        cat_id = get_or_create_recipe_category(cat_name, cat_slug)
                        if cat_id:
                            supabase_post("recipe_category_map", {
                                "recipe_id": recipe_id,
                                "category_id": cat_id,
                            })
            imported += 1
        else:
            skipped += 1

    print(f"  Done: {imported} imported, {skipped} skipped")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Simple Things Made Beautiful — WordPress Import")
    print("=" * 50)
    import_posts()
    import_recipes()
    print("\nImport complete!")
