import { Button, Card, Empty, message, Modal, Radio, Skeleton, Spin, Switch } from "antd";
import type { CheckboxGroupProps } from "antd/es/checkbox";
import { useContext, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useUpdateFloorPlanWithAreas } from "../../api/hooks/useUpdateFloorPlanWithAreas";
import { BUCKET_NAME, TEMP_ID_FORMAT } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import customFileName from "../../utils/customFileName";
import { removeTypename } from "../../utils/removeTypename";
import { repositionOutOfBoundsMarkers } from "../../utils/repositionMarkers";
import { supabase } from "../../utils/supabaseClient";
import CustomActionButtons from "../CustomActionButtons";
import FloorPlanUploader from "./FloorPlanUploader";
import { MarkerPoint } from "./MarkerPoint";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const options: CheckboxGroupProps<string>["options"] = [
    { label: "Select", value: "select" },
    { label: "Marker", value: "mark" },
];

const FloorPlandEditor = ({ loading }: { loading: boolean }) => {
    const [messageApi, contextHolderMessage] = message.useMessage();
    const [modalAntd, contextHolderModal] = Modal.useModal();
    const { modal, drawer } = useContext(DrawerVisibilityContext);
    const { handleUpdateFloorPlanWithAreas, loading: loadingUpdateFloorPlanWithAreas } =
        useUpdateFloorPlanWithAreas();
    const containerRef = useRef<any>(null);
    const [numPages, setNumPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [newFile, setNewFile] = useState<File | null>(null);
    const [highlightMarkers, setHighlightMarkers] = useState(modal.showAllMarks.visible);
    const highlightTimeoutRef = useRef<number | null>(null);
    const [loadingSave, setLoadingSave] = useState(false);
    // const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (newFile && newFile?.type.startsWith("image/")) {
            const url = URL.createObjectURL(newFile);
            setImageUrl(url);

            // Load the image to get its dimensions and reposition markers if needed
            const img = new Image();
            img.onload = () => {
                const newWidth = img.width;
                const newHeight = img.height;

                // Reposition any out-of-bounds markers
                modal.dataSet.setValue((prev) => {
                    if (!prev || !prev.areas || prev.areas.length === 0) return prev;

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
            img.src = url;

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

    const onCancel = () => {
        modalAntd.confirm({
            title: "Confirm Discard",
            content: (
                <>
                    <p>Are you sure you want to discard changes?</p>
                    <p>This action cannot be undone.</p>
                </>
            ),
            onOk: () => {
                setNewFile(null);
                modal.dataSet.setValue(modal.originalDataSet.value);
                modal.edit.setVisible(false);
                modal.selectedArea.setValue(null);
                modal.selectedTool.setValue("select");
                modal.form.dataSet.resetFields();
                setHighlightMarkers(modal.showAllMarks.visible);
            },
            okText: "YES",
        });
    };

    const onSave = async () => {
        if (!modal.id.value) {
            return;
        }

        setLoadingSave(true);

        try {
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

            const removeTempIdAreas = modal.dataSet.value?.areas?.map((area) => {
                const isTempId = typeof area.id === "string" && area.id.startsWith(TEMP_ID_FORMAT);

                return {
                    ...area,
                    id: isTempId ? undefined : area.id,
                };
            });

            await handleUpdateFloorPlanWithAreas({
                id: modal.dataSet.value?.id,
                fileName: newFile ? newFile?.name : modal.dataSet.value?.fileName || "",
                fileType: newFile ? newFile?.type : modal.dataSet.value?.fileType || "",
                filePath: newFile ? uploadedFile?.fullPath : modal.dataSet.value?.filePath,
                areas: removeTypename(removeTempIdAreas) || [],
            });

            messageApi.open({
                type: "success",
                content: "Floor plan update successfully!",
            });

            drawer.refetch.setValue((prev) => !prev);
            modal.form.dataSet.resetFields();
            modal.selectedArea.setValue(null);
            modal.originalDataSet.setValue(modal.dataSet.value);
            modal.edit.setVisible(false);
            modal.selectedTool.setValue("select");
            modal.form.dataSetInfo.resetFields();
            modal.dataSetInfo.setValue(null);
            setHighlightMarkers(modal.showAllMarks.visible);
        } catch (err) {
            messageApi.open({
                type: "error",
                content: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setLoadingSave(false);
        }
    };

    // const isPdf = newFile?.type === "application/pdf";
    const isPdf = (newFile?.type ?? modal.dataSet.value?.fileType) === "application/pdf";

    return (
        <>
            {contextHolderModal}
            {contextHolderMessage}
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
                            <Switch
                                value={modal.showAllMarks.visible}
                                onChange={(checked: boolean) => {
                                    modal.showAllMarks.setVisible(checked);
                                    setHighlightMarkers(checked);
                                }}
                            />
                        )}
                        {modal.edit.visible && modal.selectedFloorLevelId.value && (
                            <>
                                <Button onClick={onCancel}>Cancel</Button>
                                <Button type="primary" onClick={onSave} loading={loadingSave}>
                                    Save
                                </Button>
                            </>
                        )}
                        <CustomActionButtons
                            actions={
                                modal.view.visible &&
                                !modal.edit.visible &&
                                modal.selectedFloorLevelId.value
                                    ? ["edit"]
                                    : []
                            }
                            handleEdit={() => {
                                modal.edit.setVisible(true);
                                setHighlightMarkers(true);
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
                                {(modal.dataSet.value?.presignedUrl || newFile) && (
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
                            <FloorPlanUploader onFileUpload={(file) => setNewFile(file)} />
                            {/* <Pagination
                                    simple
                                    current={currentPage}
                                    total={numPages} // total items
                                    pageSize={1} // 1 item per page
                                    onChange={(page) => setCurrentPage(page)}
                                /> */}
                        </div>
                    )}
                    <div className="flex justify-center items-center !bg-gray-100 rounded-lg border-2 border-slate-800 shadow-lg min-h-[600px]">
                        <div
                            className="relative overflow-auto"
                            onClick={handleCanvasClick}
                            style={{
                                cursor:
                                    modal.selectedTool.value === "mark" ? "crosshair" : "default",
                            }}
                        >
                            {!newFile && !modal.dataSet.value?.filePath ? (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ) : (
                                <>
                                    {isPdf ? (
                                        <div ref={containerRef}>
                                            <Document
                                                key={
                                                    newFile
                                                        ? newFile.name
                                                        : modal.dataSet.value?.filePath
                                                }
                                                loading={
                                                    <div className="flex justify-center items-center h-[500px]">
                                                        <Spin />
                                                    </div>
                                                }
                                                file={
                                                    newFile
                                                        ? newFile
                                                        : modal.dataSet.value?.presignedUrl ?? ""
                                                }
                                                onLoadSuccess={({ numPages }) =>
                                                    setNumPages(numPages)
                                                }
                                                onLoadError={(error) => {
                                                    console.error("PDF load error:", error);
                                                }}
                                                className="block"
                                            >
                                                <Page
                                                    pageNumber={currentPage}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                    className="max-w-full !bg-gray-100"
                                                    onLoadSuccess={(page) => {
                                                        // Reposition markers when PDF page loads with new dimensions
                                                        if (newFile) {
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
                                                        }
                                                    }}
                                                />
                                            </Document>
                                        </div>
                                    ) : (
                                        <img
                                            ref={containerRef}
                                            src={
                                                newFile
                                                    ? imageUrl || undefined
                                                    : modal.dataSet.value?.presignedUrl || undefined
                                            }
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
                                    )}

                                    {modal.dataSet.value?.areas?.map((area) => (
                                        <MarkerPoint
                                            key={area.id}
                                            marker={area}
                                            isSelected={modal.selectedArea.value?.id === area.id}
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
                                    ))}
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
