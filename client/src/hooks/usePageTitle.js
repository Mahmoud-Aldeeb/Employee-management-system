import { useEffect } from "react";

/**
 * usePageTitle Hook updates the document title for SEO and user context.
 *
 * @param {string} title - The title of the page.
 */
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title
      ? `${title} — Employee MS`
      : "Employee Management System";
  }, [title]);
};

export default usePageTitle;
