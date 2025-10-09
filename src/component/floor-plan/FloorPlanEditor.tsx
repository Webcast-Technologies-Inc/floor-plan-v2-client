import { Button, Card, Pagination, Radio } from "antd";
import type { CheckboxGroupProps } from "antd/es/checkbox";
import { useContext, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { BUCKET_NAME } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { Marker } from "../../types/marker";
import customFileName from "../../utils/customFileName";
import { supabase } from "../../utils/supabaseClient";
import CustomActionButtons from "../CustomActionButtons";
import FloorPlanUploader from "./FloorPlanUploader";
import { MarkerPoint } from "./MarkerPoint";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const options: CheckboxGroupProps<string>["options"] = [
    { label: "Select", value: "select" },
    { label: "Marker", value: "mark" },
];

const FloorPlandEditor = () => {
    const { modal } = useContext(DrawerVisibilityContext);
    const containerRef = useRef<HTMLDivElement>(null);

    const [markers, setMarkers] = useState<Marker[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    // const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [highlightMarkers, setHighlightMarkers] = useState(false);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (files[0]?.type.startsWith("image/")) {
            const url = URL.createObjectURL(files[0]);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [files.length]);

    // useEffect(() => {
    //     const updateOffset = () => {
    //         if (containerRef.current) {
    //             const rect = containerRef.current.getBoundingClientRect();
    //             setCanvasOffset({ x: rect.left, y: rect.top });
    //         }
    //     };
    //     updateOffset();
    //     window.addEventListener("resize", updateOffset);
    //     window.addEventListener("scroll", updateOffset);
    //     return () => {
    //         window.removeEventListener("resize", updateOffset);
    //         window.removeEventListener("scroll", updateOffset);
    //     };
    // }, []);

    const handleAddMarker = (marker: Marker) => {
        setMarkers([...markers, marker]);
    };

    const handleUpdateMarker = (updatedMarker: Marker) => {
        setMarkers(markers.map((m) => (m.id === updatedMarker.id ? updatedMarker : m)));
    };

    const handleMarkerDragEnd = (markerId: string, x: number, y: number) => {
        const marker = markers.find((m) => m.id === markerId);
        if (marker) {
            handleUpdateMarker({ ...marker, x, y });
            // toast.success("Marker position updated");
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (modal.selectedTool.value === "mark") {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const newMarker: Marker = {
                id: Date.now().toString(),
                x,
                y,
                details: {
                    name: "",
                    description: "",
                },
            };

            handleAddMarker(newMarker);
            setSelectedMarkerId(newMarker.id);
            modal.selectedTool.setValue("select");
            // toast.success("Marker added! Click to edit details.");
        } else {
            // Highlight all markers when clicking on open area
            setHighlightMarkers(true);
            setTimeout(() => setHighlightMarkers(false), 2000);
        }
    };

    const isPdf = files[0]?.type === "application/pdf";

    return (
        <Card
            title={modal.dataSet.value?.name ?? ""}
            variant="outlined"
            style={{ width: "100%" }}
            extra={
                <div className="flex items-center gap-x-4">
                    <Button onClick={() => {}}>Cancel</Button>
                    <Button
                        type="primary"
                        onClick={async () => {
                            const { data, error } = await supabase.storage
                                .from(BUCKET_NAME.documents)
                                .upload(
                                    customFileName((files as any)[0]),
                                    (files[0] as any).originFileObj,
                                    {
                                        cacheControl: "3600",
                                        upsert: true,
                                    }
                                );

                            console.log("data >> ", data);

                            console.log("files >> ", files[0]);
                            console.log("markers >> ", markers);
                            console.log("currentPage >> ", currentPage);
                            console.log("modal.dataSet.value? >> ", modal.dataSet?.value);
                        }}
                        loading={false}
                    >
                        Save
                    </Button>
                    <CustomActionButtons
                        actions={["edit"]}
                        // handleDelete={handleDelete}
                    />
                </div>
            }
        >
            {files.length === 0 ? (
                <FloorPlanUploader onFileUpload={(file) => setFiles((prev) => [...prev, file])} />
            ) : (
                <div className="!space-y-4">
                    <div className="flex justify-between items-center !p-6 rounded-lg bg-gray-100">
                        <Radio.Group
                            block
                            options={options}
                            defaultValue="select"
                            optionType="button"
                            buttonStyle="solid"
                            onChange={(e) => modal.selectedTool.setValue(e.target.value)}
                            value={modal.selectedTool.value}
                        />
                        <Pagination
                            simple
                            current={currentPage}
                            total={numPages} // total items
                            pageSize={1} // 1 item per page
                            onChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                    <div
                        ref={containerRef}
                        className="relative !bg-gray-100 rounded-lg border-2 border-border shadow-lg min-h-[600px] overflow-auto"
                        onClick={handleCanvasClick}
                        style={{
                            cursor: modal.selectedTool.value === "mark" ? "crosshair" : "default",
                            overflow: "auto",
                        }}
                    >
                        {isPdf ? (
                            <Document
                                file={files[0]}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                onLoadError={(error) => {
                                    console.error("PDF load error:", error);
                                    // toast.error("Failed to load PDF");
                                }}
                                className="block"
                            >
                                <Page
                                    pageNumber={currentPage}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="max-w-full !bg-gray-100"
                                />
                            </Document>
                        ) : imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="Floor plan"
                                style={{
                                    width: "auto",
                                    height: "auto",
                                    display: "block",
                                    maxWidth: "none",
                                    maxHeight: "none",
                                    flexShrink: 0,
                                }}
                                draggable={false}
                            />
                        ) : null}

                        {markers.map((marker) => (
                            <MarkerPoint
                                key={marker.id}
                                marker={marker}
                                isSelected={selectedMarkerId === marker.id}
                                selectedTool={modal.selectedTool.value}
                                isHighlighted={highlightMarkers}
                                onClick={() => setSelectedMarkerId(marker.id)}
                                onDragEnd={(x, y) => handleMarkerDragEnd(marker.id, x, y)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
export default FloorPlandEditor;
