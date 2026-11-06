import { useEffect } from "react";

/**
 * JsonLd — renders structured data into document.head via useEffect.
 * This ensures Google/search engines parse rich data while silencing
 * React 19's client script tag execution warning.
 */
export function JsonLd({ data, id }: { data: object; id?: string }) {
  useEffect(() => {
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    if (id) script.id = id;
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [data, id]);

  return null;
}
