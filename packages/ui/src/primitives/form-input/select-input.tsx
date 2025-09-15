"use client";

import { cn } from "@mjs/ui/lib/utils";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../button";
import { getInputClass, Input } from "../input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../select";
import { SelectOption } from "./types";

export interface SelectInputProps extends React.ComponentProps<typeof Select> {
  options: SelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  create?: boolean;
  createLabel?: string;
  withImage?: boolean;
  /**
   * Key to group options by. The value should be a key in the option's meta object.
   * When provided, options will be grouped using SelectGroup and SelectLabel components.
   * 
   * @example
   * // Group options by category
   * const options = [
   *   { id: '1', value: 'apple', label: 'Apple', meta: { category: 'Fruits' } },
   *   { id: '2', value: 'banana', label: 'Banana', meta: { category: 'Fruits' } },
   *   { id: '3', value: 'carrot', label: 'Carrot', meta: { category: 'Vegetables' } },
   * ];
   * <SelectInput options={options} groupBy="category" />
   */
  groupBy?: string;
}


/**
 * Groups options by the specified key
 */
const groupOptionsByKey = (options: SelectOption[], groupByKey?: string) => {
  if (!groupByKey) {
    return { ungrouped: options };
  }

  return options.reduce((groups, option) => {
    const groupKey = option.meta?.[groupByKey] as string || 'ungrouped';
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(option);
    return groups;
  }, {} as Record<string, SelectOption[]>);
};

export function SelectInput({ options, ...rest }: SelectInputProps) {
  const {
    onChange,
    value,
    placeholder,
    className,
    create,
    createLabel,
    withImage = false,
    groupBy,
  } = rest;

  const [shouldCreate, setShouldCreate] = useState(false);
  const [displayValue, setDisplayValue] = useState(placeholder || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Find the selected option to display the correct label
    const selectedOption = options?.find(
      (option) => String(option.value) === String(value),
    );
    const newDisplayValue = selectedOption?.label || placeholder || "";

    setDisplayValue(newDisplayValue);
  }, [options, value, placeholder]);


  if (shouldCreate) {
    return (
      <div className="relative">
        <Input
          className={cn("w-full", className)}
          ref={inputRef}
          name={rest.name}
          placeholder="Type in a new option..."
        />
        <Button
          variant="ghost"
          // size='xs'
          className="absolute top-1 right-0 text-xs font-normal mb-1"
          onClick={() => setShouldCreate(false)}
          tabIndex={-1}
        >
          Cancel
        </Button>
      </div>
    );
  }

  const handleShouldCreate = () => {
    setShouldCreate(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const onValueChange = (v: SelectOption["value"]) => {
    onChange?.(String(v));
  };

  /**
   * Renders a single option
   */
  const renderOption = (option: SelectOption) => (
    <SelectItem
      key={option.id}
      value={String(option.value)}
      disabled={option.disabled}
      className={cn(
        'flex items-center gap-2',
        withImage && '[&>span:nth-child(2)]:flex-1'
      )}
      icon={withImage && typeof option.meta?.image === "string" && (
        <Image src={option.meta?.image as string} alt={option.label} width={20} height={20} />
      )}
    >
      {option.label}
    </SelectItem>
  );

  return (
    <Select onValueChange={onValueChange} defaultValue={value} {...rest}>
      <SelectTrigger
        className={cn(
          "w-full relative cursor-pointer shadow-xs",
          getInputClass(),
          className,
        )}
      >
        <SelectValue>{displayValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(() => {
          const groupedOptions = groupOptionsByKey(options || [], groupBy);

          return Object.entries(groupedOptions).map(([groupKey, groupOptions]) => {
            // If no groupBy is specified or all options are ungrouped, render without groups
            if (!groupBy || groupKey === 'ungrouped') {
              return (
                <React.Fragment key={groupKey}>
                  {groupOptions.map(renderOption)}
                </React.Fragment>
              );
            }

            // Render with groups
            return (
              <SelectGroup key={groupKey} className="">
                <SelectLabel className="text-secondary-500">{groupKey}</SelectLabel>
                {groupOptions.map(renderOption)}
              </SelectGroup>
            );
          });
        })()}
        {create && (
          <Button
            variant="ghost"
            size="sm"
            className="border-t border-t-input focus:bg-primary/10 focus:text-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            onClick={handleShouldCreate}
          >
            <span>{createLabel || "Create"}</span>
          </Button>
        )}
      </SelectContent>
    </Select>
  );
}
