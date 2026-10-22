// ZoomableImage — props copied from src/components/ui/ZoomableImage.tsx (the interface is not exported there). Documentation only; not type-checked.

export interface ZoomableImageProps {
  /** Image URL handed to next/image for both the thumbnail and the lightbox; the help page passes /help/*.png. */
  src: string;
  /** Alt text, rendered identically on the thumbnail and the full-size image. */
  alt: string;
  /** Intrinsic width in px for next/image (the width attribute of both <img>s); the help page passes 1080–1500. */
  width: number;
  /** Intrinsic height in px for next/image (the height attribute of both <img>s); the help page passes 200–800. */
  height: number;
  /** Class names for the thumbnail <img> only, not the lightbox image; every call site passes "w-full h-auto". Default "". */
  className?: string;
}

/** Client component (default export). Renders the thumbnail with its hint overlays and, while open, a fixed full-screen lightbox as a following sibling; locks body scroll while open. */
declare function ZoomableImage(props: ZoomableImageProps): JSX.Element;
export default ZoomableImage;
