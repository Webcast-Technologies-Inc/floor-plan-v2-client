import { Button, Card, Empty, Modal, Skeleton, Spin } from "antd";
import { Funnel, Pin, PinOff } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { TEMP_ID_FORMAT, TOOL } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import { repositionOutOfBoundsMarkers } from "../../utils/repositionMarkers";
import { MarkerPoint } from "./MarkerPoint";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FloorPlandEditor = ({
    loading,
    highlightMarkers,
    setHighlightMarkers,
}: {
    loading: boolean;
    highlightMarkers: boolean;
    setHighlightMarkers: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const [modalAntd, contextHolderModal] = Modal.useModal();
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

        setIsFileLoaded(true);
        const img = new Image();
        img.onload = () => {
            const newWidth = img.width;
            const newHeight = img.height;

            const reposition = (prev: any) => {
                if (!prev?.areas?.length) {
                    return prev;
                }

                return {
                    ...prev,
                    areas: repositionOutOfBoundsMarkers(prev.areas, newWidth, newHeight),
                };
            };

            modal.dataSet.setValue(reposition);
            modal.originalDataSet.setValue(reposition);
        };

        img.onerror = (err) => {
            console.error("Image failed to load:", err);
        };

        img.src = presignedUrl;
        setIsFileLoaded(false);
    }, [modal.dataSet.value?.presignedUrl]);

    const handleAddMarker = (
        marker: IFloorPlanArea,
        recentlyCreatedMarker: IFloorPlanArea | undefined | null
    ) => {
        modal.dataSet.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                areas: [
                    ...(prev.areas ?? []).filter((area) => area.id !== recentlyCreatedMarker?.id),
                    marker,
                ],
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

        if (modal.selectedTool.value === TOOL.MARKER) {
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

            handleAddMarker(newMarker, modal.recentlyCreatedMarker.value);
            modal.recentlyCreatedMarker.setValue(newMarker);
            // modal.form.dataSet.resetFields();
            // modal.form.dataSetInfo.resetFields();
            // modal.dataSetInfo.setValue(null);
            modal.selectedArea.setValue(newMarker);
        } else {
            modal.selectedArea.setValue(null);
            modal.form.dataSet.resetFields();
            modal.form.dataSetInfo.resetFields();
            modal.dataSetInfo.setValue(null);
            modal.edit.setVisible(false);
            modal.dataSet.setValue(modal.originalDataSet.value);

            // Highlight all markers when clicking on open area
            setHighlightMarkers(true);
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

    const filters = filterModal.form.getFieldValue("filter") || [];
    const hasFiltersWithValue =
        Array.isArray(filters) &&
        filters.some((f) => {
            if (!f) return false;
            // exclude "operator" field from the check
            return Object.entries(f).some(([key, val]) => key !== "operator" && !!val);
        });

    return (
        <>
            {contextHolderModal}
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
                        {/* {!modal.edit.visible && modal.selectedFloorLevelId.value && (
                            <Switch
                                value={modal.showAllMarks.visible}
                                onChange={(checked: boolean) => {
                                    modal.showAllMarks.setVisible(checked);
                                    setHighlightMarkers(checked);
                                }}
                            />
                        )} */}
                        <Button
                            style={{ position: "relative" }}
                            type="text"
                            onClick={() => filterModal.view.setVisible(true)}
                            disabled={
                                !modal.selectedFloorLevelId.value ||
                                modal.edit.visible ||
                                modal.selectedTool.value === TOOL.MARKER
                            }
                        >
                            {hasFiltersWithValue && (
                                <div className="absolute top-0 right-2 h-2 w-2 bg-red-600 rounded-full" />
                            )}
                            <Funnel size={18} />
                        </Button>
                        <Button
                            type="text"
                            onClick={() => {
                                if (modal.selectedTool.value === TOOL.MARKER) {
                                    // same on onCancel in StallInformation.tsx
                                    modalAntd.confirm({
                                        title: "Confirm Discard",
                                        content: (
                                            <>
                                                <p>Are you sure you want to discard changes?</p>
                                                <p>This action cannot be undone.</p>
                                            </>
                                        ),
                                        onOk: () => {
                                            modal.selectedTool.setValue(
                                                modal.selectedTool.value === TOOL.MARKER
                                                    ? TOOL.SELECT
                                                    : TOOL.MARKER
                                            );
                                            modal.dataSet.setValue(modal.originalDataSet.value);
                                            modal.edit.setVisible(false);
                                            modal.selectedArea.setValue(null);
                                            modal.selectedTool.setValue(TOOL.SELECT);
                                            modal.form.dataSet.resetFields();
                                            modal.form.dataSetInfo.resetFields();
                                            modal.dataSetInfo.setValue(null);
                                            setHighlightMarkers(modal.showAllMarks.visible);
                                        },
                                        okText: "YES",
                                    });
                                } else {
                                    modal.selectedTool.setValue(
                                        modal.selectedTool.value === TOOL.SELECT
                                            ? TOOL.MARKER
                                            : TOOL.SELECT
                                    );
                                }

                                setHighlightMarkers(true);
                                filterModal.dataSet.setValue(null);
                                filterModal.form.resetFields();
                            }}
                            disabled={!modal.selectedFloorLevelId.value}
                        >
                            {modal.selectedTool.value === TOOL.MARKER ? (
                                <Pin size={18} />
                            ) : (
                                <PinOff size={18} />
                            )}
                        </Button>
                    </div>
                }
                loading={loading}
            >
                <div className="h-[calc(100vh-13.5625rem)] flex justify-center items-center !bg-gray-100 rounded-lg border-2 border-slate-800 shadow-lg overflow-auto">
                    <div
                        className="relative max-w-full max-h-full"
                        onClick={handleCanvasClick}
                        style={{
                            cursor:
                                modal.selectedTool.value === TOOL.MARKER ? "crosshair" : "default",
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

                                                    const reposition = (prev: any) => {
                                                        if (!prev?.areas?.length) {
                                                            return prev;
                                                        }

                                                        return {
                                                            ...prev,
                                                            areas: repositionOutOfBoundsMarkers(
                                                                prev.areas,
                                                                newWidth,
                                                                newHeight
                                                            ),
                                                        };
                                                    };

                                                    modal.dataSet.setValue(reposition);
                                                    modal.originalDataSet.setValue(reposition);
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
                                            display: isFileLoaded ? "block" : "none",
                                            width: "auto",
                                            height: "auto",
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
                                                    if (
                                                        area.id !==
                                                        modal.recentlyCreatedMarker.value?.id
                                                    ) {
                                                        modal.dataSet.setValue(
                                                            modal.originalDataSet.value
                                                        );
                                                    }
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
            </Card>
        </>
    );
};
export default FloorPlandEditor;
