"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Download, Heart, ImageIcon } from "lucide-react"
import type { PostPack } from "@/lib/data/post-packs"

interface PostPackModalProps {
  pack: PostPack | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PostPackModal({ pack, open, onOpenChange }: PostPackModalProps) {
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (!pack) return null

  const handleCopyCaption = async (platform: string, caption: string) => {
    await navigator.clipboard.writeText(caption)
    setCopiedCaption(platform)
    setTimeout(() => setCopiedCaption(null), 2000)
  }

  const handleSave = () => {
    setSaved(!saved)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {pack.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <DialogTitle className="text-2xl">{pack.title}</DialogTitle>
          <p className="text-muted-foreground">{pack.description}</p>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 mt-4">
          {/* Image Preview Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Graphics</h3>
            <div className="aspect-square rounded-lg border border-border bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Image preview</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                PNG
              </Button>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                JPG
              </Button>
            </div>
          </div>

          {/* Captions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Captions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={saved ? "text-destructive" : "text-muted-foreground"}
              >
                <Heart className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />
                {saved ? "Saved" : "Save"}
              </Button>
            </div>

            <Tabs defaultValue="facebook" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="facebook">Facebook</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="twitter">X / Twitter</TabsTrigger>
              </TabsList>

              <TabsContent value="facebook" className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {pack.captions.facebook}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyCaption("facebook", pack.captions.facebook)}
                  className="w-full"
                >
                  {copiedCaption === "facebook" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Facebook Caption
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="instagram" className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {pack.captions.instagram}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyCaption("instagram", pack.captions.instagram)}
                  className="w-full"
                >
                  {copiedCaption === "instagram" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Instagram Caption
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="twitter" className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {pack.captions.twitter}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyCaption("twitter", pack.captions.twitter)}
                  className="w-full"
                >
                  {copiedCaption === "twitter" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy X/Twitter Caption
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
