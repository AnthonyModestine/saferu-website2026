export interface PostPack {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  updatedAt: string
  captions: {
    facebook: string
    instagram: string
    twitter: string
  }
  images: string[]
}

/** Template post packs — populated via admin CMS, not seeded with placeholder content. */
export const postPacks: PostPack[] = []

export function getPostPacksByCategory(category: string): PostPack[] {
  return postPacks.filter((pack) => pack.category === category)
}

export function getPostPackById(id: string): PostPack | undefined {
  return postPacks.find((pack) => pack.id === id)
}
