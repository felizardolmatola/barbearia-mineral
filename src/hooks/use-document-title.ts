import { useEffect } from "react";

/**
 * Define o título (e opcionalmente a meta description) da página.
 * Substitui a gestão de <head> por rota que existia no TanStack Start.
 */
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let descriptionTag: HTMLMetaElement | null = null;
    let previousDescription: string | null = null;

    if (description) {
      descriptionTag = document.querySelector('meta[name="description"]');
      if (descriptionTag) {
        previousDescription = descriptionTag.getAttribute("content");
        descriptionTag.setAttribute("content", description);
      }
    }

    return () => {
      document.title = previousTitle;
      if (descriptionTag && previousDescription !== null) {
        descriptionTag.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
