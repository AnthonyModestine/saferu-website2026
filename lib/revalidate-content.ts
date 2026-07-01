import { revalidatePath } from "next/cache"
import { isFlatCategory } from "@/lib/category-layout"

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
    if (categoryId === "whats-new" || isFlatCategory(categoryId)) {
      revalidatePath(`/${categoryId === "whats-new" ? "whats-new" : categoryId}`)
    } else {
      revalidatePath(`/${categoryId}`)
      if (subcategoryId) {
        revalidatePath(`/${categoryId}/${subcategoryId}`)
      }
    }
  }
}
