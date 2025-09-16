"use client";
import { cn } from "@mjs/ui/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mjs/ui/primitives/accordion";
import { Button } from "@mjs/ui/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mjs/ui/primitives/tabs";
import { VisuallyHidden } from "@mjs/ui/primitives/visually-hidden";
import {
  Download,
  File,
  FileAudio,
  FileText,
  FileVideo,
  ImageIcon,
  ImagesIcon,
  Info,
} from "lucide-react";
import { InformationSchemaAsStrings } from "@/common/schemas/dtos/sales/information";
import { Document } from "@/common/schemas/generated";
import { SaleWithToken } from "@/common/types/sales";
import { FieldDescription } from "@/components/buy/fields";
import ImagesSection from "@/components/images-gallery";
import { Placeholder } from "@/components/placeholder";
import { useSaleDocuments } from "@/lib/services/api";
import { getBucketUrl } from "@/lib/utils/files";

export const ProjectInformation = ({
  sale,
  children,
}: {
  sale: SaleWithToken;
  children?: React.ReactNode;
}) => {
  const { data: docs, isLoading } = useSaleDocuments(sale.id);

  return (
    <Card>
      {children}

      <VisuallyHidden>
        <CardHeader>
          <CardTitle>{sale.name}</CardTitle>
        </CardHeader>
      </VisuallyHidden>
      <CardContent className={cn("pt-6")}>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger
              value="info"
              className="data-[state=active]:bg-slate-600"
            >
              <Info className="w-4 h-4 mr-2" />
              Information
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="data-[state=active]:bg-slate-600"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documents (
              {isLoading ? (
                <Skeleton className="size-4 rounded-full" />
              ) : (
                docs?.documents?.length || 0
              )}
              )
            </TabsTrigger>
            <TabsTrigger
              value="gallery"
              className="data-[state=active]:bg-slate-600"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Gallery (
              {isLoading ? (
                <Skeleton className="size-4 rounded-full" />
              ) : (
                docs?.images?.length || 0
              )}
              )
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <ProjectInfoTab sale={sale} />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <DocumentsTab sale={sale} />
          </TabsContent>
          <TabsContent value="gallery" className="mt-6">
            <GalleryTab sale={sale} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ProjectInfoTab = ({ sale }: { sale: SaleWithToken }) => {
  const information =
    sale?.information as unknown as InformationSchemaAsStrings["information"];
  if (!information) return null;
  return (
    <div className="mt-4">
      <Accordion
        type="multiple"
        className="w-full"
        defaultValue={
          information[0]?.label ? [information[0]?.label] : undefined
        }
      >
        {information?.map((key) => {
          if (key.type === "file") {
            return null;
          }
          return (
            <AccordionItem value={key.label} key={key.label}>
              <AccordionTrigger className={"text-secondary"}>
                {key.label}
              </AccordionTrigger>
              <AccordionContent>
                <FieldDescription
                  title={undefined}
                  content={key.value}
                  render={key.value !== null && key.value !== undefined}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

const DocumentsTab = ({ sale }: { sale: SaleWithToken }) => {
  const { data, isLoading } = useSaleDocuments(sale.id);

  console.log("🚀 ~ information.tsx:154 ~ data:", data);


  if (isLoading) return <div>Loading...</div>;
  if (!data?.documents?.length)
    return (
      <Placeholder
        title="No documents found"
        description="There are no documents to display in this section."
      />
    );
  const docs = data?.documents?.filter(
    (doc) => !doc.type?.startsWith("image/"),
  );

  return (
    <div className="space-y-3 min-h-[185px]">
      {docs.map((document, index) => (
        <a
          href={document.url}
          target="_blank"
          key={index}
          download
          rel="noreferrer"
        >
          <Card
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer"
          // onClick={() => handleDownload(document)}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0 text-slate-400">
                  {getFileIcon(document.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {document.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-slate-400 truncate">
                      {decodeURIComponent(document.fileName)}
                    </span>
                    <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded flex-shrink-0">
                      {getFileExtension(document.fileName)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-600 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(document);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
};

const GalleryTab = ({ sale }: { sale: SaleWithToken }) => {
  const { data: docs, isLoading } = useSaleDocuments(sale.id);
  if (isLoading) return <div>Loading...</div>;
  if (!docs?.images?.length)
    return (
      <Placeholder
        icon={ImagesIcon}
        title="No images found"
        description="There are no images to display in this section."
      />
    );

  return (
    <div className="max-w-lg mx-auto min-h-[185px]">
      <ImagesSection
        images={docs.images.map((image) => ({
          src: getBucketUrl(image.url),
          id: image.id,
        }))}
      />
    </div>
  );
};

const getFileIcon = (type: string) => {
  const lowerType = type.toLowerCase();

  if (
    lowerType.includes("pdf") ||
    lowerType.includes("doc") ||
    lowerType.includes("txt")
  ) {
    return <FileText className="h-5 w-5" />;
  }
  if (
    lowerType.includes("image") ||
    lowerType.includes("png") ||
    lowerType.includes("jpg") ||
    lowerType.includes("jpeg")
  ) {
    return <ImageIcon className="h-5 w-5" />;
  }
  if (
    lowerType.includes("video") ||
    lowerType.includes("mp4") ||
    lowerType.includes("avi")
  ) {
    return <FileVideo className="h-5 w-5" />;
  }
  if (
    lowerType.includes("audio") ||
    lowerType.includes("mp3") ||
    lowerType.includes("wav")
  ) {
    return <FileAudio className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
};

const getFileExtension = (fileName: string) => {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
};

const handleDownload = (d: Document) => {
  // Create a temporary anchor element to trigger download
  const link = document.createElement("a");
  link.href = d.url;
  link.download = d.fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
