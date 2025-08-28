import DOMPurify from 'dompurify';

export function sanitizeReviewHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['b','i','em','strong','u','p','ul','ol','li','br','span'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script','style','svg','math','iframe','object','embed','a'],
    FORBID_ATTR: ['on*','style','href','src'],
    ALLOWED_URI_REGEXP: /^$/  // Block all URIs
  });
}

export function convertBBCodeToHtml(text: string): string {
  return text
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
}