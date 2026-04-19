import type { FC } from "hono/jsx";
import type { AvailableLanguage } from "tmdb-ts";

import { GlobeIcon } from "./icons/globe-icon.tsx";
import { MonitorIcon } from "./icons/monitor-icon.tsx";

interface PageProps {
  addonUrl: string;
  language: AvailableLanguage;
  title: string;
  description: string;
  installWebText: string;
  installAppText: string;
  logoUrl: string;
}

export const Page: FC<PageProps> = ({
  addonUrl,
  language,
  title,
  description,
  installWebText,
  installAppText,
  logoUrl,
}) => {
  const manifestUrl = `${addonUrl}/api/${language}/manifest.json`;
  const installAppUrl = manifestUrl.replace(/^https?/, "stremio");
  const installWebUrl = `https://web.stremio.com/#/addons?addon=${encodeURIComponent(manifestUrl)}`;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="icon" href={logoUrl} type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0a0a1a;
            color: #e0e0ef;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .bg-glow {
            position: fixed;
            inset: 0;
            z-index: 0;
            overflow: hidden;
          }

          .bg-glow::before {
            content: '';
            position: absolute;
            top: -40%;
            left: -20%;
            width: 80%;
            height: 80%;
            background: radial-gradient(circle, rgba(115, 75, 226, 0.15) 0%, transparent 70%);
            animation: float 12s ease-in-out infinite;
          }

          .bg-glow::after {
            content: '';
            position: absolute;
            bottom: -30%;
            right: -10%;
            width: 60%;
            height: 60%;
            background: radial-gradient(circle, rgba(60, 100, 255, 0.12) 0%, transparent 70%);
            animation: float 15s ease-in-out infinite reverse;
          }

          @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(40px, -30px); }
          }

          .card {
            position: relative;
            z-index: 1;
            max-width: 440px;
            width: 90%;
            background: rgba(20, 20, 40, 0.7);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 48px 36px;
            text-align: center;
            box-shadow: 0 8px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04) inset;
          }

          .logo {
            width: 96px;
            height: 96px;
            border-radius: 22px;
            margin-bottom: 28px;
            filter: drop-shadow(0 4px 20px rgba(115, 75, 226, 0.4));
          }

          h1 {
            font-size: 1.75rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #fff 30%, #b4a0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .description {
            font-size: 0.95rem;
            color: #9999b3;
            line-height: 1.6;
            margin-bottom: 36px;
          }

          .buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 24px;
            border-radius: 14px;
            font-size: 0.95rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
          }

          .btn-primary {
            background: linear-gradient(135deg, #7b5aea, #5a3fdb);
            color: #fff;
            box-shadow: 0 4px 20px rgba(90, 63, 219, 0.35);
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 28px rgba(90, 63, 219, 0.5);
          }

          .btn-primary:active {
            transform: translateY(0);
          }

          .btn-secondary {
            background: rgba(255, 255, 255, 0.06);
            color: #c8c8e0;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            transform: translateY(-2px);
          }

          .btn-secondary:active {
            transform: translateY(0);
          }

          .btn svg {
            flex-shrink: 0;
          }

          .manifest-url {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }

          .manifest-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #666680;
            margin-bottom: 8px;
          }

          .manifest-input-wrap {
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            overflow: hidden;
          }

          .manifest-input-wrap input {
            flex: 1;
            background: none;
            border: none;
            color: #8888a8;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 0.78rem;
            padding: 10px 14px;
            outline: none;
            min-width: 0;
          }

          .copy-btn {
            background: none;
            border: none;
            color: #7b5aea;
            padding: 10px 14px;
            cursor: pointer;
            transition: color 0.2s;
            flex-shrink: 0;
          }

          .copy-btn:hover {
            color: #a78bfa;
          }

          @media (max-width: 480px) {
            .card {
              padding: 36px 24px;
              border-radius: 20px;
            }
            h1 {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </head>
      <body>
        <div class="bg-glow" />
        <div class="card">
          <img class="logo" src={logoUrl} alt={`${title} Logo`} />
          <h1>{title}</h1>
          <p class="description">{description}</p>
          <div class="buttons">
            <a class="btn btn-primary" href={installWebUrl}>
              <GlobeIcon />
              {installWebText}
            </a>
            <a class="btn btn-secondary" href={installAppUrl}>
              <MonitorIcon />
              {installAppText}
            </a>
          </div>
          <div class="manifest-url">
            <div class="manifest-label">Manifest URL</div>
            <div class="manifest-input-wrap">
              <input type="text" value={manifestUrl} readonly id="manifest-url" />
              <button
                class="copy-btn"
                type="button"
                onclick="navigator.clipboard.writeText(document.getElementById('manifest-url').value).then(()=>{this.innerHTML='&#10003;';setTimeout(()=>{this.innerHTML='&#x2398;'},1500)});"
                title="Copy"
              >
                &#x2398;
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};
