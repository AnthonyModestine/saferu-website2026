/** OpenAI Structured Outputs schemas for Press Center generation. */

export const ANCILLARY_OUTPUTS_JSON_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "pio_ancillary_outputs",
    strict: true,
    schema: {
      type: "object",
      properties: {
        facebook: {
          type: "string",
          description: "Facebook post, 1-3 short paragraphs.",
        },
        x: {
          type: "string",
          description: "X post, 280 characters or fewer including spaces.",
        },
        talkingPoints: {
          type: "array",
          description: "Up to 8 one-sentence factual talking points.",
          items: { type: "string" },
          minItems: 0,
          maxItems: 8,
        },
      },
      required: ["facebook", "x", "talkingPoints"],
      additionalProperties: false,
    },
  },
}
