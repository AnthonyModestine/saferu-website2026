/** Copy short enough to render legibly on a 16:9 social graphic. */
export function graphicOnImageCopy(opts: {
  headline: string
  supportingLine: string
  body: string
  emergencyMessage: string
}): {
  headline: string
  supportingLine: string
  mainMessage: string
  emergencyMessage: string
} {
  const headline = opts.headline.trim().slice(0, 48)
  const supportingLine = opts.supportingLine.trim().slice(0, 60)

  const bodyWords = opts.body.trim().split(/\s+/).filter(Boolean)
  const mainMessage =
    bodyWords.length <= 14
      ? bodyWords.join(" ")
      : `${bodyWords.slice(0, 14).join(" ").replace(/[,.;:!?]+$/, "")}…`

  const emergencyRaw = opts.emergencyMessage.trim()
  const emergencyWords = emergencyRaw.split(/\s+/).filter(Boolean)
  const emergencyMessage =
    emergencyWords.length > 0 && emergencyWords.length <= 10 ? emergencyRaw.slice(0, 80) : ""

  return { headline, supportingLine, mainMessage, emergencyMessage }
}

export function countGraphicWords(copy: {
  headline: string
  supportingLine: string
  mainMessage: string
  emergencyMessage: string
}): number {
  return [copy.headline, copy.supportingLine, copy.mainMessage, copy.emergencyMessage]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length
}
