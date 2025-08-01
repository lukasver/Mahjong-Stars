'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import { Button } from '@mjs/ui/primitives/button';
import { Input } from '@mjs/ui/primitives/input';
import { Textarea } from '@mjs/ui/primitives/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mjs/ui/primitives/select';
import { AnyFieldApi } from '@tanstack/react-form';
import { FileUpload } from '@mjs/ui/components/file-upload';
import { FileWithPreview } from '@mjs/ui/hooks/use-file-upload';
import { cn } from '@mjs/ui/lib/utils';

interface FormFieldData {
  label: string;
  type: 'textarea' | 'file';
  value: string | File | null;
  props?: Record<string, string>;
}

interface EditableFormFieldProps {
  field: AnyFieldApi;
  index: number;
  onRemove: (index: number) => void;
}
export function EditableFormField({
  field,
  index,
  onRemove,
}: EditableFormFieldProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const fieldValue = field.state.value;
  const label = fieldValue?.label || 'Field Label';
  const fieldType = fieldValue?.type || 'textarea';
  const value = fieldValue?.value || '';
  const required = fieldValue?.props?.required || false;

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  const updateField = (updates: Partial<FormFieldData>) => {
    field.handleChange({
      ...fieldValue,
      ...updates,
    });
  };

  const handleLabelClick = () => {
    setIsEditingLabel(true);
  };

  const handleLabelSubmit = (newLabel: string) => {
    updateField({ label: newLabel });
    setIsEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelSubmit(e.currentTarget.value);
    }
    if (e.key === 'Escape') {
      setIsEditingLabel(false);
    }
  };

  const handleTypeChange = (newType: 'textarea' | 'file') => {
    updateField({
      type: newType,
      value: '', // Reset value when changing type
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateField({ value: e.target.value });
  };

  const handleFileChange = (files: FileWithPreview[]) => {
    const selectedFile = files[0]?.file || null;
    updateField({ value: selectedFile as File | null });
  };

  const handleRemove = () => {
    if (required) {
      return;
    }
    onRemove(index);
  };

  return (
    <div className='space-y-2 p-4 border rounded-lg bg-card'>
      {/* Header with label, type selector, and remove button */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2 flex-1'>
          {isEditingLabel ? (
            <Input
              ref={labelInputRef}
              defaultValue={label}
              onBlur={(e) => handleLabelSubmit(e.target.value)}
              onKeyDown={handleLabelKeyDown}
              className='text-sm font-medium h-8'
            />
          ) : (
            <div
              className='flex items-center gap-1 cursor-pointer hover:bg-secondary-500/50 px-2 py-1 rounded group'
              onClick={handleLabelClick}
            >
              <span className='text-sm font-medium'>{label}</span>
              <Edit2 className='h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity' />
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <Select
            value={fieldType}
            onValueChange={handleTypeChange}
            disabled={required}
          >
            <SelectTrigger className='w-24 h-8 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='textarea'>Text</SelectItem>
              <SelectItem value='file'>File</SelectItem>
            </SelectContent>
          </Select>

          {!required && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleRemove}
              className={cn(
                'h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground'
              )}
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Field input based on type */}
      {fieldType === 'textarea' ? (
        <Textarea
          placeholder={`Enter ${label.toLowerCase()}...`}
          value={typeof value === 'string' ? value : ''}
          onChange={handleTextareaChange}
          rows={4}
          className='resize-none'
          {...fieldValue?.props}
        />
      ) : (
        <FileUpload onFilesChange={handleFileChange} {...fieldValue?.props} />
      )}

      {/* Show field errors if any */}
      {field.state.meta.errors.length > 0 && (
        <div className='text-sm text-destructive'>
          {field.state.meta.errors.join(', ')}
        </div>
      )}
    </div>
  );
}
