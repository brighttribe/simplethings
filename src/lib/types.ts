export type PostStatus = 'draft' | 'scheduled' | 'published'
export type RecipeStatus = 'draft' | 'published'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  subtitle: string | null
  slug: string
  content_html: string | null
  meta_title: string | null
  meta_description: string | null
  hero_image_url: string | null
  status: PostStatus
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  blog_post_tags?: { blog_tags: BlogTag | null }[]
  blog_post_categories?: { categories: Category | null }[]
}

export interface RecipeCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Recipe {
  id: string
  title: string
  slug: string
  description: string | null
  featured_image_url: string | null
  prep_time: string | null
  cook_time: string | null
  total_time: string | null
  servings: string | null
  ingredients: string[]
  instructions: string[]
  notes: string | null
  meta_title: string | null
  meta_description: string | null
  status: RecipeStatus
  published_at: string | null
  created_at: string
  recipe_category_map?: { recipe_categories: RecipeCategory | null }[]
}

export interface ContactSubmission {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  subject: string | null
  details: string | null
  created_at: string
}
