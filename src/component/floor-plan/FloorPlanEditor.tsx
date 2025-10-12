import { Button, Card, Pagination, Radio } from "antd";
import type { CheckboxGroupProps } from "antd/es/checkbox";
import { useContext, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useUpdateFloorPlanWithAreas } from "../../api/hooks/useUpdateFloorPlanWithAreas";
import { BUCKET_NAME, TEMP_ID_FORMAT } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
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
    const { handleUpdateFloorPlanWithAreas } = useUpdateFloorPlanWithAreas();
    const containerRef = useRef<HTMLDivElement>(null);
    const [numPages, setNumPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [newFile, setNewFile] = useState<File | null>(null);
    const [highlightMarkers, setHighlightMarkers] = useState(false);
    const existingFile = modal.dataSet.value?.floorPlans;
    // const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (newFile && newFile?.type.startsWith("image/")) {
            const url = URL.createObjectURL(newFile);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [newFile]);

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

    const handleAddMarker = (marker: IFloorPlanArea) => {
        modal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                floorPlans: {
                    ...prev.floorPlans,
                    areas: [...(prev.floorPlans?.areas ?? []), marker],
                },
            };
        });
    };

    const handleUpdateMarker = (updatedMarker: IFloorPlanArea) => {
        modal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                floorPlans: {
                    ...prev.floorPlans,
                    areas: prev.floorPlans?.areas?.map((m) =>
                        m.id === updatedMarker.id ? updatedMarker : m
                    ),
                },
            };
        });
    };

    const handleMarkerDragEnd = (markerId: string, x: number, y: number) => {
        const marker = modal.dataSet.value?.floorPlans?.areas?.find((m) => m.id === markerId);

        if (marker) {
            handleUpdateMarker({ ...marker, x, y });
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (modal.selectedTool.value === "mark") {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const newMarker = {
                id: `${TEMP_ID_FORMAT}${Date.now().toString()}`,
                x,
                y,
                details: {
                    name: "",
                    description: "",
                },
            };

            handleAddMarker(newMarker);
            modal.selectedArea.setValue(newMarker);
            modal.selectedTool.setValue("select");
        } else {
            // Highlight all markers when clicking on open area
            setHighlightMarkers(true);
            modal.selectedArea.setValue(null);
            setTimeout(() => setHighlightMarkers(false), 2000);
        }
    };

    // const isPdf = newFile?.type === "application/pdf";
    const isPdf = (newFile?.type ?? existingFile?.attachments?.fileType) === "application/pdf";

    console.log("qwe >> ", modal.dataSet.value?.floorPlans);
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
                            let uploadedFile: any;
                            if (newFile) {
                                const { data, error } = await supabase.storage
                                    .from(BUCKET_NAME.documents)
                                    .upload(customFileName(newFile as any), newFile as any, {
                                        cacheControl: "3600",
                                        upsert: true,
                                    });

                                if (error) {
                                    return;
                                }

                                uploadedFile = data;
                            }

                            // if (!modal.dataSet.value?.floorPlans?.attachments) {
                            //     return;
                            // }

                            const removeTempIdAreas = modal.dataSet.value?.floorPlans?.areas?.map(
                                (area) => {
                                    const isTempId =
                                        typeof area.id === "string" &&
                                        area.id.startsWith(TEMP_ID_FORMAT);

                                    return {
                                        ...area,
                                        id: isTempId ? undefined : area.id,
                                    };
                                }
                            );
                            await handleUpdateFloorPlanWithAreas({
                                floorId: modal.dataSet.value?.id,
                                id: "1",
                                attachments: {
                                    id: newFile
                                        ? null
                                        : modal.dataSet.value?.floorPlans?.attachments?.id,
                                    fileName: newFile
                                        ? newFile?.name
                                        : modal.dataSet.value?.floorPlans?.attachments?.fileName ||
                                          "",
                                    fileType: newFile
                                        ? newFile?.type
                                        : modal.dataSet.value?.floorPlans?.attachments?.fileType ||
                                          "",
                                    filePath: newFile
                                        ? uploadedFile?.fullPath
                                        : modal.dataSet.value?.floorPlans?.attachments?.filePath,
                                },
                                areas: removeTempIdAreas || [],
                            });
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
            {!existingFile && !newFile ? (
                <FloorPlanUploader onFileUpload={(file) => setNewFile(file)} />
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
                                file={newFile ? newFile : existingFile?.attachments?.presignedUrl}
                                // file={newFile ? newFile : existingFile}
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

                        {modal.dataSet.value?.floorPlans?.areas?.map((area) => (
                            <MarkerPoint
                                key={area.id}
                                marker={area}
                                isSelected={modal.selectedArea.value?.id === area.id}
                                selectedTool={modal.selectedTool.value}
                                isHighlighted={highlightMarkers}
                                onClick={() => {
                                    modal.selectedArea.setValue(area);
                                    modal.form.setFieldsValue({
                                        name: area.details?.name,
                                        description: area.details?.description,
                                    });
                                }}
                                onDragEnd={(x, y) => handleMarkerDragEnd(area?.id ?? "", x, y)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
export default FloorPlandEditor;
