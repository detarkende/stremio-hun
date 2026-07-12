import { createFileRoute } from "@tanstack/react-router";
import { Check, Clipboard, Globe, Monitor } from "lucide-react";
import { useMemo, useState } from "react";

import { apiClient } from "#client/utils/api.ts";
import {
  defaultLanguage,
  getTranslations,
  SupportedLanguages,
  type SupportedLanguage,
} from "#translations/i18n.ts";

export const Route = createFileRoute("/")({
  component: Index,
});

const languageLabels: Record<SupportedLanguage, string> = {
  "hu-HU": "HU",
  "en-US": "EN",
};

function Index() {
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [copied, setCopied] = useState(false);
  const t = getTranslations(language);

  const manifestUrl = useMemo(() => {
    const url = apiClient[":language"].manifest.$url({ param: { language } });
    let webAddonUrl = url.toString();
    if (!webAddonUrl.endsWith(".json")) {
      webAddonUrl += ".json";
    }
    const appUrl = webAddonUrl.replace(/^https?:/, "stremio:");
    const webInstallUrl = `https://web.stremio.com/#/addons?addon=${encodeURIComponent(webAddonUrl)}`;
    return {
      webAddonUrl: webAddonUrl,
      webInstall: webInstallUrl,
      appInstall: appUrl,
    };
  }, [language]);

  function copyToClipboard() {
    navigator.clipboard.writeText(manifestUrl.webAddonUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <title>{t.addonPage.title}</title>
      <div className="min-h-screen bg-[#0d0d18] flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-2xl bg-white/5 p-8 flex flex-col items-center gap-6 border border-white/8 shadow-2xl">
          {/* Logo */}
          <img src="/logo.png" alt="Stremio Hun" className="w-20 h-20 mt-2" />

          {/* Title & description */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">{t.addonPage.title}</h1>
            <p className="text-sm text-gray-400 leading-relaxed">{t.addonPage.description}</p>
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-1 rounded-full bg-white/8 border border-white/10 p-1">
            {Object.values(SupportedLanguages).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  language === lang
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>

          {/* Install buttons */}
          <div className="w-full flex flex-col gap-3">
            <a
              href={manifestUrl.webInstall}
              className="flex items-center justify-center gap-2.5 w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              target="_blank"
            >
              <Globe className="w-5 h-5 shrink-0" />
              {t.addonPage.install.web}
            </a>

            <a
              href={manifestUrl.appInstall}
              className="flex items-center justify-center gap-2.5 w-full bg-white/8 hover:bg-white/12 active:bg-white/6 text-white font-semibold py-3 px-6 rounded-xl transition-colors border border-white/10"
            >
              <Monitor className="w-5 h-5 shrink-0" />
              {t.addonPage.install.app}
            </a>
          </div>

          {/* Manifest URL */}
          <div className="w-full space-y-2">
            <p className="text-center text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
              Manifest URL
            </p>
            <div
              title={manifestUrl.webAddonUrl}
              className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/8 px-4 py-3"
            >
              <span className="flex-1 truncate text-sm text-gray-300 font-mono">
                {manifestUrl.webAddonUrl}
              </span>
              <button
                onClick={copyToClipboard}
                title="Copy URL"
                className="shrink-0 text-gray-500 hover:text-indigo-400 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Clipboard className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
