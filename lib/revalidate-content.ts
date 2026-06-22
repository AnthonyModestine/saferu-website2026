import { revalidatePath } from "next/cache"

/** Invalidate cached admin and public pages after CMS changes. */
export function revalidateContentPages(categoryId?: string, subcategoryId?: string): void {
  revalidatePath("/admin")
  revalidatePath("/admin/categories")
  revalidatePath("/admin/articles")
  revalidatePath("/admin/unpublished")
  revalidatePath("/admin/posts")
  revalidatePath("/templates")

  if (categoryId) {
    revalidatePath(`/admin/categories/${categoryId}`)
    if (subcategoryId) {
      revalidatePath(`/admin/categories/${categoryId}/${subcategoryId}`)
    }
    if (categoryId === "whats-new") {
      revalidatePath("/whats-new")
    } else {
      revalidatePath(`/${categoryId}`)
      if (subcategoryId) {
        revalidatePath(`/${categoryId}/${subcategoryId}`)
      }
    }
  }
}
