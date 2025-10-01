import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const placeholderImages: ImagePlaceholder[] = data.placeholderImages;

const imageMap = new Map<string, ImagePlaceholder>(
    placeholderImages.map((img) => [img.id, img])
);

export function getPlaceholderImage(id: string): ImagePlaceholder {
    const image = imageMap.get(id);
    if (image) {
        return image;
    }
    // Return a default or throw an error. A default is safer.
    return {
        id: 'default',
        description: 'Default placeholder image',
        imageUrl: `https://picsum.photos/seed/default/100/100`,
        imageHint: 'placeholder',
    };
}
