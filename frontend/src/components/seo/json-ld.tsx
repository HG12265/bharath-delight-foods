/**
 * JsonLd — renders structured data as an inline <script> tag.
 * Use inside Server Components or page.tsx for rich result eligibility.
 * dangerouslySetInnerHTML is safe here because data is always
 * programmatically constructed, never from user input.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 0) }}
    />
  );
}
