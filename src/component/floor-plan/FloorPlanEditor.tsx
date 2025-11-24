import { Button, Card, Empty, Modal, Skeleton, Spin } from "antd";
import { Funnel, Pin, PinOff } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { MIME_TYPE, TEMP_ID_FORMAT, TOOL, type ITool } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import { repositionOutOfBoundsMarkers } from "../../utils/repositionMarkers";
import { MarkerPoint } from "./MarkerPoint";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FloorPlandEditor = ({ loading }: { loading: boolean }) => {
    const [modalAntd, contextHolderModal] = Modal.useModal();
    const { floorPlanPage, filterModal } = useContext(DrawerVisibilityContext);
    const [isFileLoaded, setIsFileLoaded] = useState(false);
    const containerRef = useRef<any>(null);
    const isPdf = floorPlanPage.dataset.floorPlan.value?.fileType === MIME_TYPE.PDF;

    useEffect(() => {
        const presignedUrl = floorPlanPage.dataset.floorPlan.value?.presignedUrl;
        if (
            !presignedUrl ||
            !floorPlanPage.dataset.floorPlan.value?.fileType?.startsWith("image/")
        ) {
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

            floorPlanPage.dataset.floorPlan.setValue(reposition);
        };

        img.onerror = (err) => {
            console.error("Image failed to load:", err);
        };

        img.src = presignedUrl;
        setIsFileLoaded(false);
    }, [floorPlanPage.dataset.floorPlan.value?.presignedUrl]);

    const handleAddMarker = (
        marker: IFloorPlanArea,
        recentlyCreatedMarker: IFloorPlanArea | undefined | null
    ) => {
        floorPlanPage.dataset.floorPlan.setValue((prev) => {
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
        floorPlanPage.dataset.floorPlan.setValue((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                areas: prev.areas?.map((m) => (m.id === updatedMarker.id ? updatedMarker : m)),
            };
        });
        floorPlanPage.selectedMarker.setValue(updatedMarker);
    };

    const handleMarkerDragEnd = (markerId: string, x: number, y: number) => {
        const marker = floorPlanPage.dataset.floorPlan.value?.areas?.find((m) => m.id === markerId);

        if (marker) {
            handleUpdateMarker({ ...marker, x, y });
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (floorPlanPage.selectedTool.value === TOOL.MARKER) {
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

            handleAddMarker(newMarker, floorPlanPage.newlyAddedMarker.value);
            floorPlanPage.newlyAddedMarker.setValue(newMarker);
            floorPlanPage.selectedMarker.setValue(newMarker);
        } else {
            if (floorPlanPage.edit.visible) {
                return;
            }
            floorPlanPage.selectedMarker.setValue(null);
            floorPlanPage.form.datasetId.resetFields();
            floorPlanPage.form.stallInfo.resetFields();
            floorPlanPage.dataset.stallInfo.setValue(null);
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
                        floorPlanPage.dataset.floorPlan.value?.name ?? ""
                    )
                }
                variant="outlined"
                style={{ width: "100%" }}
                extra={
                    <div className="flex items-center gap-x-4">
                        <Button
                            style={{ position: "relative" }}
                            type="text"
                            onClick={() => filterModal.view.setVisible(true)}
                            disabled={
                                !floorPlanPage.selectedFloorLevelId.value ||
                                floorPlanPage.edit.visible ||
                                floorPlanPage.selectedTool.value === TOOL.MARKER ||
                                floorPlanPage.dataset.floorPlan.value?.areas?.length === 0
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
                                const isMarkerTool =
                                    floorPlanPage.selectedTool.value === TOOL.MARKER;

                                const resetModalState = (nextTool: ITool) => {
                                    floorPlanPage.dataset.floorPlan.setValue(
                                        floorPlanPage.dataset.floorPlanUnmodifiedCopy.value
                                    );
                                    floorPlanPage.edit.setVisible(false);
                                    floorPlanPage.selectedMarker.setValue(null);
                                    floorPlanPage.selectedTool.setValue(nextTool);
                                    floorPlanPage.form.datasetId.resetFields();
                                    floorPlanPage.form.stallInfo.resetFields();
                                    floorPlanPage.dataset.stallInfo.setValue(null);
                                    floorPlanPage.newlyAddedMarker.setValue(null);
                                };

                                const resetFilterModal = () => {
                                    filterModal.dataSet.setValue(null);
                                    filterModal.form.resetFields();
                                };

                                if (isMarkerTool) {
                                    modalAntd.confirm({
                                        title: "Confirm Discard",
                                        content: (
                                            <>
                                                <p>Are you sure you want to discard changes?</p>
                                                <p>This action cannot be undone.</p>
                                            </>
                                        ),
                                        onOk: () => {
                                            resetModalState(TOOL.SELECT);
                                        },
                                        okText: "YES",
                                    });
                                } else {
                                    resetModalState(TOOL.MARKER);
                                }

                                resetFilterModal();
                            }}
                            disabled={
                                !floorPlanPage.selectedFloorLevelId.value ||
                                floorPlanPage.edit.visible
                            }
                        >
                            {floorPlanPage.selectedTool.value === TOOL.MARKER ? (
                                <Pin size={18} />
                            ) : (
                                <PinOff size={18} />
                            )}
                        </Button>
                    </div>
                }
                loading={loading}
            >
                <div className="h-[calc(100vh-13.5625rem)] flex justify-center items-center bg-gray-100! rounded-lg border-2 border-slate-800 shadow-lg overflow-auto">
                    <div
                        className="relative max-w-full max-h-full"
                        onClick={handleCanvasClick}
                        style={{
                            cursor:
                                floorPlanPage.selectedTool.value === TOOL.MARKER
                                    ? "crosshair"
                                    : "default",
                        }}
                    >
                        {!floorPlanPage.dataset.floorPlan.value?.presignedUrl ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            <>
                                {isPdf ? (
                                    <div ref={containerRef}>
                                        <Document
                                            key={
                                                floorPlanPage.dataset.floorPlan.value?.presignedUrl
                                            }
                                            loading={<Spin />}
                                            file={
                                                floorPlanPage.dataset.floorPlan.value?.presignedUrl
                                            }
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
                                                className="max-w-full bg-gray-100!"
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

                                                    floorPlanPage.dataset.floorPlan.setValue(
                                                        reposition
                                                    );
                                                }}
                                            />
                                        </Document>
                                    </div>
                                ) : (
                                    <img
                                        ref={containerRef}
                                        src={
                                            floorPlanPage.dataset.floorPlan.value?.presignedUrl ||
                                            undefined
                                        }
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
                                    floorPlanPage.dataset.floorPlan.value?.areas?.map((area) => {
                                        const isVisible = filterModal.dataSet.value
                                            ? filterModal.dataSet.value.some(
                                                  (item: any) =>
                                                      item.id_primary == area.dataSetInfoId
                                              )
                                            : true;

                                        return isVisible ? (
                                            <MarkerPoint
                                                containerRef={containerRef}
                                                key={area.id}
                                                marker={area}
                                                isSelected={
                                                    floorPlanPage.selectedMarker.value?.id ===
                                                    area.id
                                                }
                                                onClick={() => {
                                                    const recentlyCreatedId =
                                                        floorPlanPage.newlyAddedMarker.value?.id;

                                                    if (
                                                        (floorPlanPage.edit.visible &&
                                                            area.id !==
                                                                floorPlanPage.selectedMarker.value
                                                                    ?.id) ||
                                                        (floorPlanPage.selectedTool.value ===
                                                            TOOL.MARKER &&
                                                            area.id !== recentlyCreatedId)
                                                    ) {
                                                        return;
                                                    }

                                                    if (area.id !== recentlyCreatedId) {
                                                        floorPlanPage.form.datasetId.setFieldsValue(
                                                            {
                                                                dataSetInfoId: area.dataSetInfoId,
                                                            }
                                                        );
                                                    }
                                                    floorPlanPage.selectedMarker.setValue(area);
                                                }}
                                                onDragEnd={(x, y) =>
                                                    handleMarkerDragEnd(area?.id ?? "", x, y)
                                                }
                                                isDraggable={
                                                    (floorPlanPage.edit.visible &&
                                                        area.id ===
                                                            floorPlanPage.selectedMarker.value
                                                                ?.id) ||
                                                    (floorPlanPage.selectedTool.value ===
                                                        TOOL.MARKER &&
                                                        area.id ===
                                                            floorPlanPage.newlyAddedMarker.value
                                                                ?.id)
                                                }
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
