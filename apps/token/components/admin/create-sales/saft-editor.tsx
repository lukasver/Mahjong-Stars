"use client";
import { invariant } from "@epic-web/invariant";
import { CardContainer } from "@mjs/ui/components/cards";
import {
  EditorInstance,
  JSONContent,
} from "@mjs/ui/components/editor/advanced-editor";
import { Icons } from "@mjs/ui/components/icons";
import { Time } from "@mjs/ui/components/time";
import { Button } from "@mjs/ui/primitives/button";
import {
  type AnyFieldApi,
  UseAppForm,
  useFormContext,
} from "@mjs/ui/primitives/form";
import { FormInput } from "@mjs/ui/primitives/form-input";
import { Label } from "@mjs/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mjs/ui/primitives/select";
import { toast } from "@mjs/ui/primitives/sonner";
import { safeJsonParse } from "@mjs/utils/client";
import { DateTime } from "luxon";
import { useEffect, useState, useTransition } from "react";
import { SaftContract } from "@/common/schemas/generated";
import useActiveAccount from "@/components/hooks/use-active-account";
import { useSensitiveAction } from "@/components/hooks/use-sensitive-action";
import { removeApproverFromSaft } from "@/lib/actions";
import { useSaleSaft } from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import Editor from "../../Editor";
import VariablesPanel from "./variables-panel";

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.join(", ")}</em>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
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
    | undefined,
) => {
  if (arg?.saft) {
    return arg?.versions || [];
  }
  return arg?.versions || [];
};

export function SaftEditor({ saleId, placeholder }: SaftEditorProps) {
  const { data, isLoading } = useSaleSaft(saleId);
  const [isPending, startTransition] = useTransition();
  const { chainId } = useActiveAccount();

  const versions = data?.versions || [];
  const saft: SaftContract | null = data?.saft || null;

  const approver = data?.approver;



  const form = useFormContext() as unknown as UseAppForm;

  const sensitiveAction = useSensitiveAction({
    action: "edit_saft",
    saleId,
    data: { saftId: saft?.id, timestamp: Date.now() },
    onError: (error) => {
      toast.error(`Authentication failed: ${error}`);
    },
  });

  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const [selectValue, setSelectValue] = useState<string | undefined>(saft?.id);

  const handleVersionChange = (id: string) => {
    const v = getVersions(data).find((c) => c.id === id);
    if (!v) return;
    if (v && v.content) {
      const content =
        typeof v.content === "string"
          ? safeJsonParse(v.content)
          : (v.content as JSONContent[]);
      const final =
        Object.keys(content).length > 0 ? content : v.content || placeholder;
      form.setFieldValue("content", final);
      editor?.commands.setContent(final);
    }
    setSelectValue(v.id);
  };

  const handleVariableClick = (variable: string) => {
    const v = `{{${variable.trim()}}}`;
    editor?.commands.insertContent(v);
    // Move the focus to the end of the editor
    editor?.commands.focus();
  };

  const handleRemoveApprover = async () => {
    if (isPending) return;
    startTransition(async () => {
      try {
        invariant(saft?.id, "Saft ID is required");
        invariant(chainId, "Chain ID is required");
        const success = await sensitiveAction.executeAction(
          async (signature, message) => {
            await removeApproverFromSaft({
              saftId: saft.id,
              signature: {
                signature,
                message,
                chainId,
              },
            });
            form.setFieldValue("approver", {
              email: "",
              fullname: "",
              role: "APPROVER",
            })
          },
        );
        if (success) {
          const qc = getQueryClient();
          qc.invalidateQueries({ queryKey: ["sales", saleId, "saft"] });
        }
      } catch (error) {
        toast.error(
          `Error removing approver: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    });
  };

  useEffect(() => {
    // set initial editor content
    if (editor && data && !isLoading) {
      if (data?.saft?.content) {
        editor.commands.setContent(data.saft.content as string | JSONContent);
        form.setFieldValue("content", data.saft.content);
      }
      form.setFieldValue("approver.role", "APPROVER");
    }
  }, [!!editor, !!data, isLoading]);

  useEffect(() => {
    // set initial value for selector
    if (data?.saft?.id && !selectValue && versions?.length > 0) {
      setSelectValue(data.saft.id);
    }
    // set initial value for approver
    if (data?.approver) {
      form.setFieldValue("approver.email", data.approver.email);
      form.setFieldValue("approver.fullname", data.approver.fullname);
      form.setFieldValue("approver.role", data.approver.role);
    }
  }, [data?.saft?.id, selectValue, versions]);

  return (
    <>
      {versions?.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="version-config">Select active version</Label>
          <Select value={selectValue} onValueChange={handleVersionChange}>
            <SelectTrigger id="version-config" className="bg-background">
              <SelectValue placeholder="Create a new version" />
            </SelectTrigger>
            <SelectContent>
              {getVersions(data).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <p className="flex items-center justify-between gap-2">
                    <span className="text-sm">{c.name}</span>
                    <Time
                      className="text-xs text-muted-foreground"
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

      {/* Approver */}
      <div>
        <CardContainer
          className="bg-card relative"
          title="Add approver? (optional)"
          glassy={false}
          description="By adding an approver, the document will only be finalized after the approver has signed it"
        >
          <>
            {approver && (
              <Button
                variant="ghost"
                size="icon"
                loading={isPending}
                onClick={handleRemoveApprover}
                className="absolute top-2 right-2"
              >
                <Icons.x />
              </Button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <FormInput name="approver.email" type="email" label="Email" />
              <FormInput
                name="approver.fullname"
                type="text"
                label="Fullname"
              />
              <FormInput
                name="approver.role"
                type="text"
                label="Role"
                inputProps={{
                  disabled: true,
                  autoComplete: "off",
                }}
              />
            </div>
          </>
        </CardContainer>
      </div>
      <div>
        <p className="mb-1">Create new version</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="col-span-1 sm:col-span-2">
            <form.Field
              name="content"
              // biome-ignore lint/correctness/noChildrenProp: <explanation>
              children={(field) => {
                return (
                  <>
                    <div className="relative min-h-[500px] w-full h-full bg-white sm:rounded-lg sm:shadow-lg border-2 border-black">
                      <Editor
                        setEditor={setEditor}
                        className="bg-white text-black h-full border-none! overflow-y-auto"
                        output="html"
                        classes={{
                          editor: "max-w-full!",
                        }}
                        onChange={(value) => {
                          field.handleChange(value as string);
                        }}
                        initialValue={{
                          type: "doc",
                          content: [
                            {
                              type: "paragraph",
                              content: [
                                {
                                  type: "text",
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
          <div className="col-span-1">
            <VariablesPanel
              className="w-full"
              onClickVariable={handleVariableClick}
            />
          </div>
        </div>
      </div>
    </>
  );
}
