-- Insert the real blog category hierarchy
DO $$
DECLARE
  decor_id uuid;
  holiday_id uuid;
  diy_id uuid;
BEGIN
  -- Top-level categories
  INSERT INTO categories (name, slug, parent_id, sort_order)
  VALUES ('Decor & Styling', 'decor-styling', NULL, 1)
  ON CONFLICT (slug) DO UPDATE SET sort_order = 1
  RETURNING id INTO decor_id;

  INSERT INTO categories (name, slug, parent_id, sort_order)
  VALUES ('Holiday & Seasonal', 'holiday-seasonal', NULL, 2)
  ON CONFLICT (slug) DO UPDATE SET sort_order = 2
  RETURNING id INTO holiday_id;

  INSERT INTO categories (name, slug, parent_id, sort_order)
  VALUES ('DIY & Refreshes', 'diy-refreshes', NULL, 3)
  ON CONFLICT (slug) DO UPDATE SET sort_order = 3
  RETURNING id INTO diy_id;

  -- Decor & Styling subcategories
  INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
    ('Living Room',            'living-room',          decor_id, 1),
    ('Bedroom',                'bedroom',               decor_id, 2),
    ('Kitchen & Dining',       'kitchen-dining',        decor_id, 3),
    ('Entryway & Hallway',     'entryway',              decor_id, 4),
    ('Outdoor Spaces',         'outdoor-spaces',        decor_id, 5),
    ('Home Office',            'home-office',           decor_id, 6),
    ('Color & Paint',          'color-paint',           decor_id, 7),
    ('Furniture & Arrangement','furniture',             decor_id, 8)
  ON CONFLICT (slug) DO NOTHING;

  -- Holiday & Seasonal subcategories
  INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
    ('Christmas',          'christmas',          holiday_id, 1),
    ('Fall & Thanksgiving','fall-thanksgiving',  holiday_id, 2),
    ('Spring & Easter',   'spring-easter',      holiday_id, 3),
    ('Summer',            'summer',             holiday_id, 4),
    ('Everyday Seasonal', 'everyday-seasonal',  holiday_id, 5)
  ON CONFLICT (slug) DO NOTHING;

  -- DIY & Refreshes subcategories
  INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
    ('Budget Makeovers',        'budget-makeovers', diy_id, 1),
    ('Thrift & Vintage',        'thrift-vintage',   diy_id, 2),
    ('Paint Projects',          'paint-projects',   diy_id, 3),
    ('Shelf & Vignette Styling','shelf-vignette',   diy_id, 4)
  ON CONFLICT (slug) DO NOTHING;
END $$;
