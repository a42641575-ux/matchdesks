export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape "<" so job-supplied text (e.g. a description containing "</script>")
  // can't break out of the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
