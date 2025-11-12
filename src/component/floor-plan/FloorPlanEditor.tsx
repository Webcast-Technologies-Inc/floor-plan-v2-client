import { Button, Card, Empty, Radio, Skeleton, Spin, Switch } from "antd";
import type { CheckboxGroupProps } from "antd/es/checkbox";
import { useContext, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { TEMP_ID_FORMAT } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import { repositionOutOfBoundsMarkers } from "../../utils/repositionMarkers";
import CustomActionButtons from "../CustomActionButtons";
import { MarkerPoint } from "./MarkerPoint";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const options: CheckboxGroupProps<string>["options"] = [
    { label: "Select", value: "select" },
    { label: "Marker", value: "mark" },
];

const FloorPlandEditor = ({
    loading,
    highlightMarkers,
    setHighlightMarkers,
}: {
    loading: boolean;
    highlightMarkers: boolean;
    setHighlightMarkers: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const { modal, filterModal } = useContext(DrawerVisibilityContext);
    const containerRef = useRef<any>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const [isFileLoaded, setIsFileLoaded] = useState(false);
    const isPdf = modal.dataSet.value?.fileType === "application/pdf";

    useEffect(() => {
        const presignedUrl = modal.dataSet.value?.presignedUrl;
        if (!presignedUrl || !modal.dataSet.value?.fileType?.startsWith("image/")) {
            return;
        }

        const img = new Image();
        img.onload = () => {
            const newWidth = img.width;
            const newHeight = img.height;

            modal.dataSet.setValue((prev) => {
                if (!prev?.areas?.length) return prev;

                const repositionedAreas = repositionOutOfBoundsMarkers(
                    prev.areas,
                    newWidth,
                    newHeight
                );

                return {
                    ...prev,
                    areas: repositionedAreas,
                };
            });
        };

        img.onerror = (err) => {
            console.error("Image failed to load:", err);
        };

        img.src = presignedUrl;
    }, [modal.dataSet.value?.presignedUrl]);

    const handleAddMarker = (marker: IFloorPlanArea) => {
        modal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                areas: [...(prev.areas ?? []), marker],
            };
        });
    };

    const handleUpdateMarker = (updatedMarker: IFloorPlanArea) => {
        modal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                areas: prev.areas?.map((m) => (m.id === updatedMarker.id ? updatedMarker : m)),
            };
        });
        modal.selectedArea.setValue(updatedMarker);
    };

    const handleMarkerDragEnd = (markerId: string, x: number, y: number) => {
        const marker = modal.dataSet.value?.areas?.find((m) => m.id === markerId);

        if (marker) {
            handleUpdateMarker({ ...marker, x, y });
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (modal.selectedTool.value === "mark") {
            const markerSize = 24; // approximate size of your marker icon

            // Get click position relative to container
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            // Clamp to container bounds
            x = Math.max(markerSize / 2, Math.min(x, rect.width - markerSize / 2));
            y = Math.max(markerSize, Math.min(y, rect.height));

            const newMarker = {
                id: `${TEMP_ID_FORMAT}${Date.now().toString()}`,
                x,
                y,
                dataSetInfoId: "",
            };

            handleAddMarker(newMarker);
            modal.form.dataSet.resetFields();
            modal.selectedArea.setValue(newMarker);
            modal.selectedTool.setValue("select");
        } else {
            // Highlight all markers when clicking on open area
            setHighlightMarkers(true);
            modal.selectedArea.setValue(null);
            modal.form.dataSet.resetFields();
            modal.form.dataSetInfo.resetFields();
            modal.dataSetInfo.setValue(null);

            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            highlightTimeoutRef.current = window.setTimeout(() => {
                if (!modal.showAllMarks.visible && !modal.edit.visible) {
                    setHighlightMarkers(false);
                }
            }, 2000);
        }
    };

    return (
        <>
            <Card
                title={
                    loading ? (
                        <Skeleton.Input active size="small" style={{ width: 200 }} />
                    ) : (
                        modal.dataSet.value?.name ?? ""
                    )
                }
                variant="outlined"
                style={{ width: "100%" }}
                extra={
                    <div className="flex items-center gap-x-4">
                        {!modal.edit.visible && modal.selectedFloorLevelId.value && (
                            <Button onClick={() => filterModal.view.setVisible(true)}>
                                Filter
                            </Button>
                        )}
                        {!modal.edit.visible && modal.selectedFloorLevelId.value && (
                            <Switch
                                value={modal.showAllMarks.visible}
                                onChange={(checked: boolean) => {
                                    modal.showAllMarks.setVisible(checked);
                                    setHighlightMarkers(checked);
                                }}
                            />
                        )}
                        <CustomActionButtons
                            actions={
                                !modal.edit.visible && modal.selectedFloorLevelId.value
                                    ? ["edit"]
                                    : []
                            }
                            handleEdit={() => {
                                modal.edit.setVisible(true);
                                setHighlightMarkers(true);
                                filterModal.dataSet.setValue(null);
                                filterModal.form.resetFields();
                            }}
                        />
                    </div>
                }
                loading={loading}
            >
                <div className="!space-y-4">
                    {modal.edit.visible && (
                        <div className="flex justify-between items-center !p-6 rounded-lg bg-gray-100">
                            <div>
                                {modal.dataSet.value?.presignedUrl && (
                                    <Radio.Group
                                        block
                                        options={options}
                                        defaultValue="select"
                                        optionType="button"
                                        buttonStyle="solid"
                                        onChange={(e) =>
                                            modal.selectedTool.setValue(e.target.value)
                                        }
                                        value={modal.selectedTool.value}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                    <div className="h-[calc(100vh-314px)] flex justify-center items-center !bg-gray-100 rounded-lg border-2 border-slate-800 shadow-lg overflow-auto">
                        <div
                            className="relative max-w-full max-h-full"
                            onClick={handleCanvasClick}
                            style={{
                                cursor:
                                    modal.selectedTool.value === "mark" ? "crosshair" : "default",
                            }}
                        >
                            {!modal.dataSet.value?.presignedUrl ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ) : (
                                <>
                                    {isPdf ? (
                                        <div ref={containerRef}>
                                            <Document
                                                key={modal.dataSet.value?.presignedUrl}
                                                loading={<Spin />}
                                                file={modal.dataSet.value?.presignedUrl}
                                                onLoadSuccess={() => {
                                                    setIsFileLoaded(true);
                                                }}
                                                onLoadError={(error) => {
                                                    console.error("PDF load error:", error);
                                                }}
                                                className="block"
                                            >
                                                <Page
                                                    pageNumber={1}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                    className="max-w-full !bg-gray-100"
                                                    onLoadSuccess={(page) => {
                                                        // Reposition markers when PDF page loads with new dimensions
                                                        const viewport = page.getViewport({
                                                            scale: 1,
                                                        });
                                                        const newWidth = viewport.width;
                                                        const newHeight = viewport.height;

                                                        modal.dataSet.setValue((prev) => {
                                                            if (
                                                                !prev ||
                                                                !prev.areas ||
                                                                prev.areas.length === 0
                                                            )
                                                                return prev;

                                                            const repositionedAreas =
                                                                repositionOutOfBoundsMarkers(
                                                                    prev.areas,
                                                                    newWidth,
                                                                    newHeight
                                                                );

                                                            return {
                                                                ...prev,
                                                                areas: repositionedAreas,
                                                            };
                                                        });
                                                    }}
                                                />
                                            </Document>
                                        </div>
                                    ) : (
                                        <img
                                            ref={containerRef}
                                            src={modal.dataSet.value?.presignedUrl || undefined}
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
                                            onLoad={() => setIsFileLoaded(true)}
                                        />
                                    )}

                                    {!isPdf && !isFileLoaded && <Spin />}

                                    {isFileLoaded &&
                                        modal.dataSet.value?.areas?.map((area) => {
                                            const isVisible = filterModal.dataSet.value
                                                ? filterModal.dataSet.value.some(
                                                      (item: any) =>
                                                          item.id_primary == area.dataSetInfoId
                                                  )
                                                : true;

                                            return isVisible ? (
                                                <MarkerPoint
                                                    key={area.id}
                                                    marker={area}
                                                    isSelected={
                                                        modal.selectedArea.value?.id === area.id
                                                    }
                                                    selectedTool={modal.selectedTool.value}
                                                    isHighlighted={highlightMarkers}
                                                    onClick={() => {
                                                        modal.selectedArea.setValue(area);
                                                        modal.form.dataSet.setFieldsValue({
                                                            dataSetInfoId: area.dataSetInfoId,
                                                        });
                                                    }}
                                                    onDragEnd={(x, y) =>
                                                        handleMarkerDragEnd(area?.id ?? "", x, y)
                                                    }
                                                    isEditable={modal.edit.visible}
                                                    containerRef={containerRef}
                                                />
                                            ) : null;
                                        })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </>
    );
};
export default FloorPlandEditor;
