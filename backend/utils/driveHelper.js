/**
 * Google Drive URL Helper
 * Converts standard sharing links into embeddable secure preview modes.
 */

/**
 * Extracts the file ID from various Google Drive sharing link formats.
 * Supported formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/edit
 * 
 * @param {string} url - The Google Drive URL
 * @returns {string|null} The extracted File ID or null if invalid
 */
const extractDriveId = (url) => {
  if (!url || typeof url !== 'string') return null;

  // Regex patterns
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/FILE_ID/view
    /id=([a-zA-Z0-9_-]+)/,         // ?id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/        // /d/FILE_ID/edit
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Converts a Google Drive link to an embeddable preview link.
 * 
 * @param {string} url - The Google Drive URL
 * @returns {string} The preview URL
 */
const convertToEmbedUrl = (url) => {
  const fileId = extractDriveId(url);
  if (!fileId) return url; // Fallback to original if matching fails
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

module.exports = {
  extractDriveId,
  convertToEmbedUrl
};
