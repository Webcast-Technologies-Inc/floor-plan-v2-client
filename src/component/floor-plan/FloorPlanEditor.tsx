import { Button, Card, message, Modal, Radio, Skeleton } from "antd";
import type { CheckboxGroupProps } from "antd/es/checkbox";
import { useContext, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useUpdateFloorPlanWithAreas } from "../../api/hooks/useUpdateFloorPlanWithAreas";
import { BUCKET_NAME, TEMP_ID_FORMAT } from "../../constant";
import DrawerVisibilityContext from "../../store/context/DrawerVisibilityContext";
import type { IFloorPlanArea } from "../../types/floorPlan";
import customFileName from "../../utils/customFileName";
import { removeTypename } from "../../utils/removeTypename";
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
    const containerRef = useRef<HTMLDivElement>(null);
    const [numPages, setNumPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [newFile, setNewFile] = useState<File | null>(null);
    const [highlightMarkers, setHighlightMarkers] = useState(false);
    const existingFile = modal.dataSet.value?.floorPlans;
    const highlightTimeoutRef = useRef<number | null>(null);
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
            modal.form.resetFields();

            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            highlightTimeoutRef.current = window.setTimeout(() => {
                setHighlightMarkers(false);
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
                modal.dataSet.setValue(modal.originalDataSet.value);
                modal.edit.setVisible(false);
                modal.selectedTool.setValue("select");
                modal.form.resetFields();
            },
            okText: "YES",
        });
    };

    const onSave = async () => {
        if (!modal.id.value) {
            return;
        }

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

        const removeTempIdAreas = modal.dataSet.value?.floorPlans?.areas?.map((area) => {
            const isTempId = typeof area.id === "string" && area.id.startsWith(TEMP_ID_FORMAT);

            return {
                ...area,
                id: isTempId ? undefined : area.id,
            };
        });

        const resp = await handleUpdateFloorPlanWithAreas({
            floorId: modal.dataSet.value?.id,
            id: modal.dataSet.value?.floorPlans?.id,
            attachments: {
                id: newFile ? null : modal.dataSet.value?.floorPlans?.attachments?.id,
                fileName: newFile
                    ? newFile?.name
                    : modal.dataSet.value?.floorPlans?.attachments?.fileName || "",
                fileType: newFile
                    ? newFile?.type
                    : modal.dataSet.value?.floorPlans?.attachments?.fileType || "",
                filePath: newFile
                    ? uploadedFile?.fullPath
                    : modal.dataSet.value?.floorPlans?.attachments?.filePath,
            },
            areas: removeTypename(removeTempIdAreas) || [],
        });

        if (!resp) {
            messageApi.open({
                type: "error",
                content: "Failed to update Floor Plan!",
            });
            return;
        }

        messageApi.open({
            type: "success",
            content: "Floor plan update successfully!",
        });

        drawer.refetch.setValue((prev) => !prev);
        modal.originalDataSet.setValue(modal.dataSet.value);
        modal.edit.setVisible(false);
        modal.selectedTool.setValue("select");
    };

    // const isPdf = newFile?.type === "application/pdf";
    const isPdf = (newFile?.type ?? existingFile?.attachments?.fileType) === "application/pdf";

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
                        {modal.edit.visible && modal.selectedFloorLevelId.value && (
                            <>
                                <Button onClick={onCancel}>Cancel</Button>
                                <Button
                                    type="primary"
                                    onClick={onSave}
                                    loading={loadingUpdateFloorPlanWithAreas}
                                >
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
                            handleEdit={() => modal.edit.setVisible(true)}
                        />
                    </div>
                }
                loading={loading}
            >
                {!existingFile && !newFile ? (
                    <FloorPlanUploader onFileUpload={(file) => setNewFile(file)} />
                ) : (
                    <div className="!space-y-4">
                        {modal.edit.visible && (
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
                                {/* <Pagination
                                    simple
                                    current={currentPage}
                                    total={numPages} // total items
                                    pageSize={1} // 1 item per page
                                    onChange={(page) => setCurrentPage(page)}
                                /> */}
                            </div>
                        )}
                        <div
                            ref={containerRef}
                            className="relative !bg-gray-100 rounded-lg border-2 border-border shadow-lg min-h-[600px] overflow-auto"
                            onClick={handleCanvasClick}
                            style={{
                                cursor:
                                    modal.selectedTool.value === "mark" ? "crosshair" : "default",
                                overflow: "auto",
                            }}
                        >
                            {isPdf ? (
                                <Document
                                    key={
                                        newFile ? newFile.name : existingFile?.attachments?.filePath
                                    }
                                    file={
                                        newFile
                                            ? newFile
                                            : existingFile?.attachments?.presignedUrl ?? ""
                                    }
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
                            ) : (
                                <img
                                    src={
                                        newFile
                                            ? imageUrl || undefined
                                            : existingFile?.attachments?.presignedUrl || undefined
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
                                    isEditable={modal.edit.visible}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        </>
    );
};
export default FloorPlandEditor;
