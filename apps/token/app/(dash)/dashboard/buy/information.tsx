'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@mjs/ui/primitives/accordion';

import { FieldDescription } from '@/components/buy/fields';
import { SaleInformationItem } from '@/common/schemas/dtos/sales';

import { useSaleDocuments } from '@/lib/services/api';
import { Skeleton } from '@mjs/ui/primitives/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@mjs/ui/primitives/tabs';
import { FileText, ImageIcon, ImagesIcon, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { VisuallyHidden } from '@mjs/ui/primitives/visually-hidden';
import { cn } from '@mjs/ui/lib/utils';
import { Placeholder } from '@/components/placeholder';
import { SaleWithToken } from '@/common/types/sales';

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
      <CardContent className={cn('pt-6')}>
        <Tabs defaultValue='info' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 bg-slate-700/50'>
            <TabsTrigger
              value='info'
              className='data-[state=active]:bg-slate-600'
            >
              <Info className='w-4 h-4 mr-2' />
              Information
            </TabsTrigger>
            <TabsTrigger
              value='documents'
              className='data-[state=active]:bg-slate-600'
            >
              <FileText className='w-4 h-4 mr-2' />
              Documents (
              {isLoading ? (
                <Skeleton className='size-4 rounded-full' />
              ) : (
                docs?.documents?.length || 0
              )}
              )
            </TabsTrigger>
            <TabsTrigger
              value='gallery'
              className='data-[state=active]:bg-slate-600'
            >
              <ImageIcon className='w-4 h-4 mr-2' />
              Gallery (
              {isLoading ? (
                <Skeleton className='size-4 rounded-full' />
              ) : (
                docs?.images?.length || 0
              )}
              )
            </TabsTrigger>
          </TabsList>

          <TabsContent value='info' className='mt-6'>
            <ProjectInfoTab sale={sale} />
          </TabsContent>
          <TabsContent value='documents' className='mt-6'>
            <DocumentsTab sale={sale} />
          </TabsContent>
          <TabsContent value='gallery' className='mt-6'>
            <GalleryTab sale={sale} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ProjectInfoTab = ({ sale }: { sale: SaleWithToken }) => {
  const information =
    sale?.information as unknown as Array<SaleInformationItem>;
  if (!information) return null;
  return (
    <div className='mt-4'>
      <Accordion
        type='multiple'
        className='w-full'
        defaultValue={
          information[0]?.label ? [information[0]?.label] : undefined
        }
      >
        {information?.map((key) => {
          if (key.type === 'file') {
            return null;
          }
          return (
            <AccordionItem value={key.label} key={key.label}>
              <AccordionTrigger>{key.label}</AccordionTrigger>
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
  const { data: docs, isLoading } = useSaleDocuments(sale.id);
  console.debug('🚀 ~ overview.tsx:138 ~ DocumentsTab ~ docs:', docs);
  if (isLoading) return <div>Loading...</div>;
  if (!docs)
    return (
      <Placeholder
        title='No documents found'
        description='There are no documents to display in this section.'
      />
    );
  return (
    <div>
      <h1>Documents</h1>
    </div>
  );
};

const GalleryTab = ({ sale }: { sale: SaleWithToken }) => {
  const { data: docs, isLoading } = useSaleDocuments(sale.id);
  if (isLoading) return <div>Loading...</div>;
  if (!docs)
    return (
      <Placeholder
        icon={ImagesIcon}
        title='No images found'
        description='There are no images to display in this section.'
      />
    );

  return (
    <div>
      <h1>Gallery</h1>
    </div>
  );
};
