import { getAllPostsForAdmin } from "@/lib/admin-content-list"
import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"
import { PostsListClient } from "./posts-list-client"

export default async function AdminPostsPage() {
  await Promise.all([loadCmsAdditions(), loadVisibility()])
  const posts = getAllPostsForAdmin()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
        <p className="mt-1 text-gray-500">
          {posts.length} post{posts.length !== 1 ? "s" : ""} across all articles — search, filter, and bulk delete
        </p>
      </div>
      <PostsListClient posts={posts} />
    </div>
  )
}
