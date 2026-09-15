// E8: Hàm stripHtmlTags dùng DOMParser an toàn (fallback replace regex cho SSR)
export const stripHtmlTags = (html?: string): string => {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>?/gm, '');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};
