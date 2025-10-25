"use client";

import {
  FileUploadOptions,
  FileWithPreview,
  useFileUpload,
} from "@mjs/ui/hooks/use-file-upload";
import { Button } from "@mjs/ui/primitives/button";
import { AlertDialogTrigger } from "@radix-ui/react-alert-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  AlertCircleIcon,
  CameraIcon,
  ImageIcon,
  Loader2,
  PaperclipIcon,
  Upload,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Camera, CameraProps, CameraType } from "react-camera-pro";
import { base64ToFile, cn } from "../lib/utils";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTitle } from "../primitives/alert-dialog";
import { ButtonGroup } from "../primitives/button-group";

const isImage = (fileName: string | null) => {
  if (!fileName) return false;
  return (
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".gif") ||
    fileName.endsWith(".webp")
  );
};

type FileUploadProps = Partial<FileUploadOptions> & {
  className?: string;
  type?: "image" | "document" | "camera" | "camera-only" | "all";
  maxSizeMB?: number;
  label?: ReactNode;
  cameraProps?: Pick<CameraProps, "facingMode" | "aspectRatio">;
  cameraClassName?: string;
};

const imageTypes =
  "image/svg+xml,image/png,image/jpeg,image/jpg,image/gif,image/webp";
const documentTypes =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

const typeMapping = {
  image: imageTypes,
  document: documentTypes,
  camera: imageTypes,
  "camera-only": imageTypes,
  all: imageTypes + "," + documentTypes,
};

export function FileUpload({ type = "all", label, ...props }: FileUploadProps) {
  const maxSizeMB = props.maxSizeMB || 2;
  const maxSize = maxSizeMB * 1024 * 1024; // 2MB default
  const cameraRef = useRef<CameraType>(null);
  const [isShutterOpen, setIsShutterOpen] = useState(false);
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
      addFiles,

    },
  ] = useFileUpload({
    accept: typeMapping[type],
    maxSize,
    ...props,
  });
  const previewUrl = files[0]?.preview || null;

  const fileName = files[0]?.file.name || null;

  const handleTakePicture = () => {
    const photo = cameraRef?.current?.takePhoto();
    if (photo && typeof photo === "string") {
      const file = base64ToFile(photo, "camera-photo.jpg", "image/jpeg");
      addFiles([file]);
      setIsShutterOpen(false);
    }
  };



  return (
    <AlertDialog open={isShutterOpen}>
      <div className={cn("flex flex-col gap-2", props.className)}>
        <div className="relative">
          {/* Drop area */}
          <div
            onDragEnter={type === 'camera-only' ? undefined : handleDragEnter}
            onDragLeave={type === 'camera-only' ? undefined : handleDragLeave}
            onDragOver={type === 'camera-only' ? undefined : handleDragOver}
            onDrop={type === 'camera-only' ? undefined : handleDrop}
            data-dragging={type === 'camera-only' ? false : isDragging || undefined}
            className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
          >
            <input
              {...getInputProps()}
              className="sr-only"
              aria-label="Upload file"
            />
            {previewUrl ? (
              props.multiple ? (
                <MultipleFilesPreview
                  files={files}
                  type={type}
                  onRemoveFile={removeFile}
                />
              ) : type === "image" || type === "camera" || isImage(fileName) ? (
                <ImagePreview
                  url={previewUrl}
                  type={type}
                  fileName={fileName}
                />
              ) : (
                <DocumentPreview
                  fileName={fileName}
                  size={files[0]?.file.size}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                <FileUploadHeader
                  type={type}
                  maxSizeMB={maxSizeMB}
                  multiple={props.multiple}
                  label={label}
                />
                {type?.includes("camera") ? (
                  <ButtonGroup className="mt-4">
                    {type === 'camera' && <Button variant="outline" onClick={() => openFileDialog()}>
                      <Upload className="mr-2 size-4" />
                      Upload File
                    </Button>}

                    <AlertDialogTrigger
                      asChild
                      onClick={() => setIsShutterOpen(true)}
                    >
                      <Button variant="outline">
                        <CameraIcon className="mr-2 size-4" />
                        Take Picture
                      </Button>
                    </AlertDialogTrigger>
                  </ButtonGroup>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={openFileDialog}
                  >
                    <UploadIcon
                      className="-ms-1 size-4 opacity-60"
                      aria-hidden="true"
                    />
                    Select{" "}
                    {props.multiple
                      ? "files"
                      : type === "image"
                        ? "image"
                        : "file"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {previewUrl && !props.multiple && (
            <div className="absolute top-4 right-4">
              <button
                type="button"
                className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
                // @ts-expect-error fixme
                onClick={() => removeFile(files[0]?.id)}
                aria-label="Remove file"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div
            className="text-destructive flex items-center gap-1 text-xs"
            role="alert"
          >
            <AlertCircleIcon className="size-3 shrink-0" />
            <span>{errors[0]}</span>
          </div>
        )}
      </div>
      {type?.includes("camera") && isShutterOpen && (
        <AlertDialogContent
          className={cn("z-50! w-full aspect-square max-w-none sm:max-w-xl m-auto flex flex-col items-center justify-center bg-primary rounded-2xl", props.cameraClassName)}
        >
          <VisuallyHidden>
            <AlertDialogTitle>Take Picture</AlertDialogTitle>
          </VisuallyHidden>
          <CameraShutter
            cameraRef={cameraRef}
            onCancel={() => {
              setIsShutterOpen(false)
            }
            }
            onTakePicture={handleTakePicture}
            cameraProps={props.cameraProps}
          />
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}

const CameraShutter = (props: {
  cameraRef: React.RefObject<CameraType | null>;
  onCancel: () => void;
  onTakePicture: () => void;
  cameraProps?: Pick<CameraProps, "facingMode" | "aspectRatio">;
}) => {
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cameraElement = props.cameraRef.current;
      if (cameraElement) {
        setIsCameraReady(true)
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <div className="z-50 flex-1 relative w-full h-full">
        <div className={cn("absolute inset-0 flex items-center justify-center", isCameraReady && "hidden")}>
          <Loader2 className="size-8 animate-spin" />
        </div>
        <Camera
          ref={props.cameraRef}
          errorMessages={{
            noCameraAccessible:
              "No camera device accessible. Please connect your camera or try a different browser.",
            permissionDenied:
              "Permission denied. Please refresh and give camera permission.",
            switchCamera:
              "It is not possible to switch camera to different one because there is only one video device accessible.",
            canvas: "Canvas is not supported.",
          }}
          {...(props.cameraProps || {})}
        />
      </div>
      <div className="w-full shrink-0 flex items-center justify-center gap-2 bg-primary z-[9999]">
        <AlertDialogCancel
          onClick={props.onCancel}
          asChild
        >
          <Button
            variant="outline"
            className="shrink-0 mt-0"
          >
            Cancel
          </Button>
        </AlertDialogCancel>
        <Button
          className="w-full flex-1"
          onClick={props.onTakePicture}
        >
          Take Picture
        </Button>
      </div>
    </>
  );
};

const FileUploadHeader = ({
  type,
  maxSizeMB,
  multiple,
  label,
}: {
  type: NonNullable<FileUploadProps["type"]>;
  maxSizeMB: number;
  multiple?: boolean;
  label?: ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="flex items-center justify-center gap-4">
        {["all", "image", "camera"].includes(type) && (
          <div
            className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-solid border-secondary-300"
            aria-hidden="true"
          >
            <ImageIcon className="size-4 opacity-90 text-secondary-300" />
          </div>
        )}
        {["all", "document"].includes(type) && (
          <div
            className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-solid border-secondary-300"
            aria-hidden="true"
          >
            <UploadIcon className="size-4 opacity-90 text-secondary-300" />
          </div>
        )}
        {["camera", "camera-only"].includes(type) && (
          <div
            className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-solid border-secondary-300"
            aria-hidden="true"
          >
            <CameraIcon className="size-4 opacity-90 text-secondary-300" />
          </div>
        )}
      </div>
      {label || (
        <p className="mb-1.5 text-sm font-medium">
          {multiple
            ? "Drop your files here"
            : type === "image"
              ? "Drop your image here"
              : "Upload file"}
        </p>
      )}
      <p className="text-secondary-300 text-xs">
        {multiple
          ? `Drag & drop or click to browse (max. ${maxSizeMB}MB per file)`
          : type === "image"
            ? `SVG, PNG, JPG or GIF (max. ${maxSizeMB}MB)`
            : `Drag & drop or click to browse (max. ${maxSizeMB}MB)`}
      </p>
    </div>
  );
};

const MultipleFilesPreview = ({
  files,
  type,
  onRemoveFile,
}: {
  files: FileWithPreview[];
  type: string;
  onRemoveFile: (id: string) => void;
}) => {
  return (
    <div className="space-y-2 w-full">
      {files.map((file) => (
        <div key={file.id} className="relative">
          <div className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2 w-full">
            <div className="flex items-center gap-3 overflow-hidden w-full">
              {type === "image" || isImage(file.file.name) ? (
                <ImageIcon
                  className="size-4 shrink-0 opacity-60"
                  aria-hidden="true"
                />
              ) : (
                <PaperclipIcon
                  className="size-4 shrink-0 opacity-60"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">
                  {file.file.name}
                </p>
              </div>
              <span className="shrink-0 text-muted-foreground text-sm">
                ({((file.file.size || 0) / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              className="flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={() => onRemoveFile(file.id)}
              aria-label="Remove file"
            >
              <XIcon className="size-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const DocumentPreview = ({
  fileName,
  size,
}: {
  fileName: string | null;
  size: number | undefined;
}) => {

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between gap-2 rounded-xl border px-4 py-2 w-full">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          <PaperclipIcon
            className="size-4 shrink-0 opacity-60"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{fileName}</p>
          </div>
          <span className="shrink-0 text-muted-foreground text-sm">
            ({((size || 0) / 1024).toFixed(1)} KB)
          </span>
        </div>
      </div>
    </div>
  );
};

const ImagePreview = ({
  url,
  type,
  fileName,
}: {
  url: string;
  type: string;
  fileName?: string | null;
}) => {

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <img
        src={url}
        alt={fileName || `Uploaded ${type === "image" ? "image" : "file"}`}
        className="mx-auto max-h-full rounded object-contain"
      />
    </div>
  );
};
