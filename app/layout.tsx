import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIAGMS",
  description: "Sistem Informasi Manajemen Proyek",
};

import { Providers } from "./providers";

const removeExtensionHydrationAttrsScript = `
(function () {
  var attributeName = "bis_skin_checked";

  function removeInjectedAttributes(root) {
    if (!root) return;

    if (
      root.nodeType === 1 &&
      root.hasAttribute &&
      root.hasAttribute(attributeName)
    ) {
      root.removeAttribute(attributeName);
    }

    if (!root.querySelectorAll) return;

    var nodes = root.querySelectorAll("[" + attributeName + "]");
    for (var i = 0; i < nodes.length; i += 1) {
      nodes[i].removeAttribute(attributeName);
    }
  }

  removeInjectedAttributes(document.documentElement);

  if (!window.MutationObserver || !document.documentElement) return;

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i += 1) {
      var mutation = mutations[i];

      if (
        mutation.type === "attributes" &&
        mutation.attributeName === attributeName
      ) {
        removeInjectedAttributes(mutation.target);
      }

      for (var j = 0; j < mutation.addedNodes.length; j += 1) {
        removeInjectedAttributes(mutation.addedNodes[j]);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributeFilter: [attributeName],
    attributes: true,
    childList: true,
    subtree: true
  });

  window.addEventListener("load", function () {
    removeInjectedAttributes(document.documentElement);
    window.setTimeout(function () {
      observer.disconnect();
    }, 1000);
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-jakarta antialiased"
        suppressHydrationWarning
      >
        <Script id="remove-extension-hydration-attrs" strategy="beforeInteractive">
          {removeExtensionHydrationAttrsScript}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
