"use client";
import { invariant } from "@epic-web/invariant";
import { Icons } from "@mjs/ui/components/icons";
import { FadeAnimation } from "@mjs/ui/components/motion";
import { RainbowButton } from "@mjs/ui/components/rainbow-button";
import { Button } from "@mjs/ui/primitives/button";
import { CardDescription } from "@mjs/ui/primitives/card";
import { useAppForm } from "@mjs/ui/primitives/form";
import { FormInput } from "@mjs/ui/primitives/form-input";
import { Separator } from "@mjs/ui/primitives/separator";
import { toast } from "@mjs/ui/primitives/sonner";
import { Mail, Phone, Ticket, User, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { Quest, questResultValidator } from "@/components/claim/types";
import { Confetti, ConfettiRef } from "@/components/confetti";
import { metadata } from "@/data/config/metadata";
import { SHEETS_ERROR_CODES } from "@/lib/constants";
import Altcha from "../Altcha";
import { usePostHog } from "../PostHogProvider";

type ClaimFormProps = Pick<
  Quest,
  "id" | "inputs" | "expiration" | "results"
> & {};

export default function ClaimForm({
  id,
  inputs,
  expiration,
  results,
}: ClaimFormProps) {
  const t = useTranslations("ClaimForm");
  const locale = useLocale();
  const altchaRef = useRef<{ value: string | null; reset: () => void } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { captureEvent, PostHogEvents } = usePostHog();
  const confettiRef = useRef<ConfettiRef>(null);
  const router = useRouter();

  async function onSubmit(data: Record<string, string>) {
    if (isPending) return;
    const captcha = altchaRef.current?.value;
    startTransition(async () => {
      try {
        invariant(captcha, t("messages.error.captchaFailed"));
        const result = await fetch("/api/claim", {
          method: "POST",
          body: JSON.stringify(Object.assign(data, { captcha })),
        }).then((res) => res.json() as Promise<{ success: boolean }>);

        if (!result.success) {
          if ("error" in result) {
            if (result.error === SHEETS_ERROR_CODES.QUEST_FINALIZED) {
              setTimeout(() => {
                router.push("/");
              }, 2000);
              throw new Error(t("messages.error.questFinalized"));
            }
          }
          throw new Error(t("messages.error.title"));
        }

        // Should submit the form to the corresponding spreadsheet
        toast.success(t("messages.success.title"), {
          description: t("messages.success.description"),
          duration: 4000,
        });
        captureEvent(PostHogEvents.claimQuest, {
          questId: id,
          ...data,
        });
        form.reset();
        altchaRef.current?.reset();
        // Needed so the confetti is triggered after the transition is complete
        startTransition(() => {
          setIsSubmitted(true);
        });
        setTimeout(() => {
          router.push("/");
        }, 8000);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An error occurred";
        toast.error(message);
      }
    });
  }

  const form = useAppForm({
    validators: {
      onSubmit: questResultValidator,
    },
    defaultValues: {
      id: id,
      code: "",
      results: results || "",
      ...(inputs?.reduce(
        (acc, input) => {
          acc[input] = "";
          return acc;
        },
        {} as Record<string, string>,
      ) ?? {}),
    },
    onSubmit: ({ value }) => onSubmit(value),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  // Show congratulations message after successful submission
  if (isSubmitted) {
    return (
      <div className="text-center space-y-6 py-8">
        <FadeAnimation delay={0.1} duration={0.8} ease="easeOut" scale>
          <div className="space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-foreground">
              {t("messages.success.title")}
            </h2>
            <CardDescription className="text-secondary">
              {t("messages.success.description")}
            </CardDescription>
            <p className="text-sm text-muted-foreground">
              Redirecting to home page...
            </p>
          </div>
        </FadeAnimation>
        <Confetti
          ref={confettiRef}
          className="absolute inset-0 size-full z-10"
        />
      </div>
    );
  }

  return (
    <form.AppForm>
      <form onSubmit={handleSubmit} className="space-y-4">

        <FadeAnimation
          delay={0.1}
          className="space-y-4"
          duration={0.6}
          ease="easeOut"
          scale
        >
          <FadeAnimation delay={0.1} duration={0.6} ease="easeOut" scale>
            <FormInput
              name="code"
              type="text"
              label={t("fields.code.label")}
              inputProps={{
                placeholder: t("fields.code.placeholder"),
                required: true,
                autoComplete: "off",
                icon: getIcon("code"),
              }}
            />
          </FadeAnimation>

          {inputs?.map((input, index) => (
            <FadeAnimation
              key={input}
              delay={0.2 + index * 0.1}
              duration={0.6}
              ease="easeOut"
              scale
            >
              <FormInput
                name={input}
                type="text"
                label={t(`fields.${input}.label`)}
                inputProps={{
                  required: true,
                  icon: getIcon(input),
                  placeholder: t(`fields.${input}.placeholder`),
                }}
              />
            </FadeAnimation>
          ))}
        </FadeAnimation>

        <FadeAnimation
          delay={0.5 + (inputs?.length || 0) * 0.1}
          duration={0.6}
          ease="easeOut"
          scale
        >
          <Altcha ref={altchaRef} language={locale} />
        </FadeAnimation>

        <FadeAnimation
          delay={0.3 + (inputs?.length || 0) * 0.1}
          duration={0.6}
          ease="easeOut"
          scale
        >
          <RainbowButton
            variant="outline"
            className="w-full h-12 rounded-full text-base font-medium"
            type="submit"
            disabled={isPending}
          >
            {isPending ? t("buttons.claiming") : t("buttons.claim")}
          </RainbowButton>
        </FadeAnimation>

        <FadeAnimation
          delay={0.4 + (inputs?.length || 0) * 0.1}
          duration={0.6}
          ease="easeOut"
          scale
        >
          <div className="pt-4">
            <div className="flex items-center gap-4 mb-4">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-sm text-center">
                {t("notifications")}
              </span>
              <Separator className="flex-1" />
            </div>

            <div className="mb-3 flex flex-wrap sm:justify-center gap-4">
              <a href={metadata.discord}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Discord"
                  className="size-4"
                >
                  <Icons.discord className="size-full p-2" />
                </Button>
              </a>
              <a href={metadata.twitter}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="𝕏 (formerly Twitter)"
                  className="size-4"
                >
                  <Icons.xTwitter className="size-full p-2" />
                </Button>
              </a>
            </div>
          </div>
        </FadeAnimation>
      </form>
    </form.AppForm>
  );
}

// help me create a helper fn that inputs

const getIcon = (input: string) => {
  switch (input) {
    case "code":
      return <Ticket className="size-8 p-2" />;
    case "name":
      return <User className="size-8 p-2" />;
    case "wallet":
      return <Wallet className="size-8 p-2" />;
    case "email":
      return <Mail className="size-8 p-2" />;
    case "telegram":
      return <Icons.telegram className="size-8 p-2" />;
    case "phone":
      return <Phone className="size-8 p-2" />;
    case "discord":
      return <Icons.discord className="size-8 p-2" />;
    case "twitter":
      return <Icons.xTwitter className="size-8 p-2" />;
  }
};
