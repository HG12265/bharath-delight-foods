import React, { lazy, Suspense } from "react";

export default function dynamic(loader: any, options: any = {}) {
  const Component = lazy(async () => {
    const res = await loader();
    if (res && typeof res === "object" && "default" in res) {
      return res;
    }
    return { default: res };
  });

  return function Dynamic(props: any) {
    return (
      <Suspense fallback={options?.loading ? <options.loading /> : null}>
        <Component {...props} />
      </Suspense>
    );
  };
}

