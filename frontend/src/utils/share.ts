/**
 * Utility for sharing content using the native Web Share API
 * Fallback to copying to clipboard if the Web Share API is not supported.
 */
export const shareContent = async (
    title: string,
    text: string,
    url?: string
): Promise<boolean> => {
    const shareUrl = url || window.location.href;

    if (navigator.share) {
        try {
            await navigator.share({
                title,
                text,
                url: shareUrl
            });
            return true;
        } catch (error) {
            // User likely cancelled the share sheet, not necessarily an error we need to alert for
            console.log('Share was cancelled or failed', error);
            return false;
        }
    } else {
        // Fallback for browsers that do not support Web Share API (e.g. some desktop browsers)
        try {
            await navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl}`);
            alert('Link copied to clipboard!');
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard', error);
            alert('Failed to copy link.');
            return false;
        }
    }
};
