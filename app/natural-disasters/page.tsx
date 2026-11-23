import { redirect } from "next/navigation"

/** Legacy URL — live Content Library category is /natural-disaster */
export default function NaturalDisastersRedirectPage() {
  redirect("/natural-disaster")
}
