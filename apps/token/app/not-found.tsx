import { EnterAnimation, FadeAnimation } from "@mjs/ui/components/motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ErrorImage from "@/public/static/images/error-char.webp";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="relative w-screen h-screen sm:h-[468px] lg:h-auto overflow-hidden xl:h-[calc(100dvh-10px)]">
      <div
        className={`bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center min-h-[100dvh] w-full h-full`}
      >
        <div className="grid place-content-center bg-gradient-to-b from-primary to-5% to-transparent h-full">
          {/* Overlay */}
          <div className="absolute inset-0 bg-red-900/20" />

          {/* Main Content */}
          <main className="h-full grid place-content-center lg:block">
            <div className="relative z-10 flex flex-col xl:min-h-screen lg:min-h-[650px]">
              {/* Desktop Layout */}
              <div className="hidden md:flex flex-1 items-center">
                <div className="container mx-auto px-8">
                  <div className="grid grid-cols-2 gap-8 items-center">
                    {/* Left Side - Error Content */}
                    <div className="space-y-8 lg:space-y-20">
                      <EnterAnimation duration={1}>
                        <h1 className="text-6xl/[90%] xl:text-8xl/[90%] font-semibold text-white">
                          {t("title")}
                        </h1>
                      </EnterAnimation>

                      <div className="space-y-4 max-w-md font-head">
                        <FadeAnimation delay={1.5} duration={2}>
                          <p className="text-white/90 text-lg lg:text-xl font-normal font-head">
                            {t("description")}
                            <br />
                            {t("subDescription")}
                          </p>
                        </FadeAnimation>
                        <FadeAnimation delay={3.5} duration={2}>
                          <Link
                            href="/"
                            className="border-2 inline-flex items-center px-8 py-3 text-white font-semibold  rounded-lg hover:bg-white hover:text-red-900 transition-colors duration-200 uppercase font-common"
                          >
                            {t("backToHome")}
                          </Link>
                        </FadeAnimation>
                      </div>
                    </div>

                    {/* Right Side - Space for Image */}
                    <div className="flex items-center justify-center">
                      <div className="w-64 h-64  rounded-lg  flex items-center justify-center">
                        <p className="text-white/60 text-sm text-center">
                          <Image {...ErrorImage} alt="error character" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden flex flex-col h-screen sm:h-auto relative">
                <div className="flex-1 flex items-start lg:justify-center pt-8 lg:pt-12 px-6">
                  <div className="text-center space-y-6">
                    <EnterAnimation duration={1}>
                      <h1 className="text-4xl font-semibold text-white">
                        {t("title")}
                      </h1>
                    </EnterAnimation>
                    <FadeAnimation delay={1.5} duration={2}>
                      <p className="text-white/90 text-base">
                        {t("description")}
                        <br />
                        {t("mobileDescription")}
                      </p>
                    </FadeAnimation>
                  </div>
                </div>

                <div className="flex-1 hidden lg:block" />

                <FadeAnimation delay={0.2}>
                  <div
                    role={"button"}
                    className="lg:bg-gradient-to-t lg:from-red-900/90 lg:to-transparent p-6 space-y-4 max-w-sm"
                  >
                    <Link
                      href="/"
                      className="inline-flex items-center px-6 py-2 text-white border-2 font-semibold border-white rounded-lg hover:bg-white hover:text-red-900 transition-colors duration-200 uppercase font-common text-sm"
                    >
                      {t("backToHome")}
                    </Link>
                  </div>
                </FadeAnimation>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
