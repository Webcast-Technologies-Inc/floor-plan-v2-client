export const MANILA_POSITION = { lat: 14.5995, lng: 120.9842 };

export const MARKER_SIZE = 24;

export const TEMP_ID_FORMAT = "area-";

export const MIME_TYPE = {
    PDF: "application/pdf",
};

export const TOOL = {
    SELECT: "select",
    MARKER: "marker",
} as const;

export type ITool = (typeof TOOL)[keyof typeof TOOL];

export const BUCKET_NAME = {
    documents: "documents",
};
