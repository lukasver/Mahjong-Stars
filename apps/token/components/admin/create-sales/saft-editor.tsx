'use client';
import {
  UseAppForm,
  useFormContext,
  type AnyFieldApi,
} from '@mjs/ui/primitives/form';
import { Label } from '@mjs/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mjs/ui/primitives/select';
import { Time } from '@mjs/ui/components/time';
import { DateTime } from 'luxon';
import { useSaleSaft } from '@/lib/services/api';
import { useEffect, useState } from 'react';
import {
  EditorInstance,
  JSONContent,
} from '@mjs/ui/components/editor/advanced-editor';
import Editor from '../../Editor';
import { SaftContract } from '@/common/schemas/generated';
import { safeJsonParse } from '@mjs/utils/client';
import VariablesPanel from './variables-panel';

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.join(', ')}</em>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
}

interface SaftEditorProps {
  saleId?: string;
  placeholder?: string;
  className?: string;
}

const getVersions = (
  arg:
    | {
        saft: SaftContract | null;
        versions: SaftContract[];
      }
    | null
    | undefined
) => {
  if (arg?.saft) {
    return arg?.versions || [];
  }
  return arg?.versions || [];
};

export function SaftEditor({ saleId, placeholder }: SaftEditorProps) {
  const { data, isLoading } = useSaleSaft(saleId);

  const versions = data?.versions || [];
  const saft: SaftContract | null = data?.saft || null;

  const form = useFormContext() as unknown as UseAppForm;

  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const [selectValue, setSelectValue] = useState<string | undefined>(saft?.id);

  const handleVersionChange = (id: string) => {
    const v = getVersions(data).find((c) => c.id === id);
    if (!v) return;
    if (v && v.content) {
      const content =
        typeof v.content === 'string'
          ? safeJsonParse(v.content)
          : (v.content as JSONContent[]);
      const final =
        Object.keys(content).length > 0 ? content : v.content || placeholder;
      form.setFieldValue('content', final);
      editor?.commands.setContent(final);
    }
    setSelectValue(v.id);
  };

  useEffect(() => {
    // set initial editor content
    if (editor && data && !isLoading) {
      if (data?.saft?.content) {
        editor.commands.setContent(data.saft.content as string | JSONContent);
        form.setFieldValue('content', data.saft.content);
      }
    }
  }, [!!editor, !!data, isLoading]);

  useEffect(() => {
    // set initial value for seletor
    if (data?.saft?.id && !selectValue && versions?.length > 0) {
      setSelectValue(data.saft.id);
    }
  }, [data?.saft?.id, selectValue, versions]);

  return (
    <>
      {versions?.length > 0 ? (
        <div className='space-y-2'>
          <Label htmlFor='version-config'>Select active version</Label>
          <Select value={selectValue} onValueChange={handleVersionChange}>
            <SelectTrigger id='version-config' className='bg-background'>
              <SelectValue placeholder='Create a new version' />
            </SelectTrigger>
            <SelectContent>
              {getVersions(data).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <p className='flex items-center justify-between gap-2'>
                    <span className='text-sm'>{c.name}</span>
                    <Time
                      className='text-xs text-muted-foreground'
                      date={c.createdAt}
                      format={DateTime.DATETIME_MED}
                    />
                  </p>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div>
        <p className='mb-1'>Create new version</p>
        <div className='grid grid-cols-3 gap-4'>
          <div className='col-span-2'>
            <form.Field
              name='content'
              // biome-ignore lint/correctness/noChildrenProp: <explanation>
              children={(field) => {
                return (
                  <>
                    <div className='relative min-h-[500px] w-full h-full bg-white sm:rounded-lg sm:shadow-lg border-2 border-black'>
                      <Editor
                        setEditor={setEditor}
                        className='bg-white text-black h-full border-none! overflow-y-auto'
                        output='html'
                        classes={{
                          editor: 'max-w-full!',
                        }}
                        onChange={(value) => {
                          field.handleChange(value as string);
                        }}
                        initialValue={{
                          type: 'doc',
                          content: [
                            {
                              type: 'paragraph',
                              content: [
                                {
                                  type: 'text',
                                  text: placeholder,
                                },
                              ],
                            },
                          ],
                        }}
                      />
                      <FieldInfo field={field} />
                    </div>
                  </>
                );
              }}
            />
          </div>
          <div className='col-span-1'>
            <VariablesPanel className='w-full' />
          </div>
        </div>
      </div>
    </>
  );
}
