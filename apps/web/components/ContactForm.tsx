"use client";

import { Button } from "@mjs/ui/primitives/button";
import { Dialog } from "@mjs/ui/primitives/dialog";
import { useAppForm } from "@mjs/ui/primitives/form";
import { FormInput } from "@mjs/ui/primitives/form-input";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { toast } from "@mjs/ui/primitives/sonner";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef, useState, useTransition } from "react";
// import { submitContactForm } from '@/lib/actions';
import * as z from "zod";
import { useRouter } from "@/lib/i18n/navigation";
import { usePostHog } from "./PostHogProvider";

const Altcha = dynamic(() => import("@/components/Altcha"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[68px] bg-red-900" />,
});

const getFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(2, {
      message: t("validation.name.minLength"),
    }),
    email: z.string().email({
      message: t("validation.email.invalid"),
    }),
    subject: z.string().min(5, {
      message: t("validation.subject.minLength"),
    }),
    message: z
      .string()
      .min(10, {
        message: t("validation.message.minLength"),
      })
      .max(1000, {
        message: t("validation.message.maxLength"),
      }),
  });

const ContactForm = () => {
  const [isPending, startTransition] = useTransition();
  const { captureEvent, PostHogEvents } = usePostHog();
  const t = useTranslations("ContactForm");
  const locale = useLocale();
  const altchaRef = useRef<{ value: string | null; reset: () => void } | null>(
    null,
  );
  const router = useRouter();

  const form = useAppForm({
    validators: { onSubmit: getFormSchema(t) },
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    onSubmit: ({ value }) => onSubmit(value),
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  async function onSubmit(values: z.infer<ReturnType<typeof getFormSchema>>) {
    const captcha = altchaRef.current?.value;
    startTransition(async () => {
      try {
        if (!captcha) {
          throw new Error(t("messages.error.captchaFailed"));
        }

        const result = await fetch("/api/captcha", {
          method: "POST",
          body: JSON.stringify(Object.assign(values, { captcha })),
        }).then((res) => res.json() as Promise<{ success: boolean }>);

        if (result.success) {
          toast.success(t("messages.success.title"), {
            description: t("messages.success.description"),
          });
          captureEvent(PostHogEvents.contactFormSubmit, {
            name: values.name,
            email: values.email,
            subject: values.subject,
          });
          form.reset();
          altchaRef.current?.reset();
          router.back();
        } else {
          toast.error(
            t("messages.error.title"),
            // @ts-expect-error fixme
            result?.error
              ? {
                description:
                  // @ts-expect-error fixme
                  result.error,
              }
              : undefined,
          );
        }
      } catch (error: unknown) {
        toast.error(
          t("messages.error.title"),
          error instanceof Error
            ? {
              description: error.message,
            }
            : undefined,
        );
      }
    });
  }
  return (
    <>
      <form.AppForm>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              name="name"
              type="text"
              label={t("fields.name.label")}
              inputProps={{
                placeholder: t("fields.name.placeholder"),
              }}
            />
            <FormInput
              name="email"
              type="email"
              label={t("fields.email.label")}
              inputProps={{
                placeholder: t("fields.email.placeholder"),
              }}
            />
          </div>
          <FormInput
            name="subject"
            type="text"
            label={t("fields.subject.label")}
            inputProps={{
              placeholder: t("fields.subject.placeholder"),
            }}
          />
          <FormInput
            name="message"
            type="textarea"
            label={t("fields.message.label")}
            inputProps={{
              placeholder: t("fields.message.placeholder"),
            }}
          />

          <Altcha ref={altchaRef} language={locale} />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="flex-1"
            >
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {t("buttons.send")}
            </Button>
          </div>
        </form>
      </form.AppForm>
    </>
  );
};

const ContactFormModal = ({
  children,
  initialOpen = true,
}: {
  children: React.ReactNode;
  initialOpen?: boolean;
}) => {
  const [open, setOpen] = useState(initialOpen);
  const router = useRouter();
  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      router.push("/");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
};
export { ContactForm, ContactFormModal };
