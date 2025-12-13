/**
 * Tailwind-based pastel color palette for tags
 * Each entry contains both background and text color classes
 */
const TAG_COLORS = [
  'bg-red-100 text-red-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-orange-100 text-orange-800',
];

/**
 * Simple string hash function
 * Converts a string to a consistent numeric hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent Tailwind color class for a tag name
 * The same tag name will always return the same color
 * 
 * @param tagName - The name of the tag
 * @returns A Tailwind CSS class string (e.g., "bg-blue-100 text-blue-800")
 */
export function getTagColor(tagName: string): string {
  const hash = hashString(tagName.toLowerCase());
  const colorIndex = hash % TAG_COLORS.length;
  return TAG_COLORS[colorIndex];
}

