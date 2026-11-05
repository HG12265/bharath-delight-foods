import { useEffect } from "react";
export default function Script({ src, onLoad, onReady, ...props }: any) {
  useEffect(() => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    const done = () => {
      onLoad?.();
      onReady?.();
    };
    if (script?.dataset.loaded) {
      done();
      return;
    }
    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
    const loaded = () => {
      script!.dataset.loaded = "true";
      done();
    };
    script.addEventListener("load", loaded);
    return () => script?.removeEventListener("load", loaded);
  }, [src]);
  return null;
}
