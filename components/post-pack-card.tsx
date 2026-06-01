"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink } from "lucide-react"
import type { PostPack } from "@/lib/data/post-packs"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"

interface PostPackCardProps {
  pack: PostPack
  onOpenPack: (pack: PostPack) => void
}

export function PostPackCard({ pack, onOpenPack }: PostPackCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCaptions = async () => {
    const allCaptions = `FACEBOOK:\n${pack.captions.facebook}\n\nINSTAGRAM:\n${pack.captions.instagram}\n\nTWITTER/X:\n${pack.captions.twitter}`
    const ok = await copyTextToClipboard(allCaptions)
    if (!ok) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="flex flex-col border-border bg-card transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          {pack.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-lg text-card-foreground">{pack.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">{pack.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Last updated: {new Date(pack.updatedAt).toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => onOpenPack(pack)}
          className="flex-1"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Pack
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCaptions}
          className="flex-1 bg-transparent"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Captions
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
