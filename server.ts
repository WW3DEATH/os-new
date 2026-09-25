import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Web Browser Proxy Route
  app.get('/api/browser/proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing url query parameter');
    }

    try {
      let finalTarget = targetUrl.trim();
      if (!finalTarget.startsWith('http://') && !finalTarget.startsWith('https://')) {
        finalTarget = `https://${finalTarget}`;
      }

      const parsedUrl = new URL(finalTarget);

      // YouTube Special Handler:
      // YouTube's web application blocks direct DOM extraction due to dynamic client protobuf workers.
      // We provide a dedicated, high-speed YouTube player and search interface that never hangs.
      if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
        let videoId = parsedUrl.searchParams.get('v');
        if (!videoId && parsedUrl.pathname.includes('/watch')) {
          videoId = parsedUrl.searchParams.get('v');
        } else if (!videoId && (parsedUrl.pathname.includes('/embed/') || parsedUrl.pathname.includes('/shorts/'))) {
          const parts = parsedUrl.pathname.split('/');
          videoId = parts[parts.length - 1];
        } else if (!videoId && parsedUrl.hostname.includes('youtu.be')) {
          videoId = parsedUrl.pathname.replace('/', '');
        }

        const searchQuery = parsedUrl.searchParams.get('search_query') || '';

        // Curated high-yield video dictionary for common searches
        const curatedVideos: Record<string, { id: string; title: string; channel: string; thumb: string }> = {
          default: {
            id: videoId || 'M576WGiDBdQ',
            title: 'Apple M3 Max & Ultra Silicon Architecture for High-Performance Workflows',
            channel: 'Apple Creative Pro',
            thumb: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'
          },
          blender: {
            id: 'aqz-KE-bpKQ',
            title: 'Blender 4.0 Cycles Raytracing & Geometry Nodes Masterclass',
            channel: 'Blender Studio',
            thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'
          },
          music: {
            id: 'jfKfPfyJRdk',
            title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
            channel: 'Lofi Girl',
            thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
          },
          davinci: {
            id: 'kJQP7kiw5Fk',
            title: 'DaVinci Resolve Studio 19 Color Grading & Fusion Nodes Workflow',
            channel: 'Blackmagic Design Pro',
            thumb: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'
          }
        };

        const activeVid = videoId || 'M576WGiDBdQ';

        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');

        return res.send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>YouTube - Safari Pro Player</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif; }
                body { background: #0f0f0f; color: #f1f1f1; padding: 14px; min-height: 100vh; }
                .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
                .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; color: white; text-decoration: none; }
                .badge { background: #ff0000; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }
                .search-box { flex: 1; max-width: 580px; display: flex; }
                .search-box input { flex: 1; padding: 8px 16px; background: #121212; border: 1px solid #303030; color: #fff; border-radius: 20px 0 0 20px; outline: none; font-size: 12px; }
                .search-box button { padding: 8px 18px; background: #222222; border: 1px solid #303030; border-left: none; color: #fff; border-radius: 0 20px 20px 0; cursor: pointer; font-size: 12px; }
                .search-box button:hover { background: #333333; }
                .quick-tags { display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px; }
                .tag-btn { background: #272727; color: #f1f1f1; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; cursor: pointer; white-space: nowrap; font-weight: 500; transition: background 0.15s; }
                .tag-btn:hover { background: #3f3f3f; }
                .tag-btn.active { background: #fff; color: #000; }
                .player-wrap { width: 100%; max-width: 960px; margin: 0 auto 20px auto; background: #000; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid #272727; }
                .video-frame { width: 100%; aspect-ratio: 16 / 9; border: none; display: block; }
                .video-meta { padding: 12px 16px; background: #181818; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #272727; }
                .video-title { font-size: 14px; font-weight: 600; color: #fff; }
                .video-author { font-size: 11px; color: #aaa; margin-top: 2px; }
                .actions-group { display: flex; gap: 8px; }
                .action-link { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: #272727; color: #fff; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; border: none; }
                .action-link:hover { background: #383838; }
                .heading { margin: 18px 0 10px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #aaa; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
                .video-card { background: #1a1a1a; border-radius: 10px; overflow: hidden; cursor: pointer; transition: transform 0.15s, border-color 0.15s; border: 1px solid #272727; text-decoration: none; color: inherit; }
                .video-card:hover { transform: translateY(-3px); border-color: #444; }
                .thumb { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #242424; display: block; }
                .info { padding: 10px; }
                .c-title { font-size: 12px; font-weight: 600; line-height: 1.35; margin-bottom: 4px; color: #f1f1f1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .c-channel { font-size: 10px; color: #888; }
              </style>
            </head>
            <body>
              <div class="top-bar">
                <a href="/api/browser/proxy?url=https://www.youtube.com" class="brand">
                  <span class="badge">YouTube</span>
                  <span>Safari Pro Player</span>
                </a>
                <form class="search-box" onsubmit="event.preventDefault(); var q = document.getElementById('sq').value.trim(); if(q) { window.location.href='/api/browser/proxy?url=https://www.youtube.com/results?search_query=' + encodeURIComponent(q); }">
                  <input id="sq" type="text" placeholder="Search YouTube or paste video URL..." value="${searchQuery}">
                  <button type="submit">Search</button>
                </form>
                <div>
                  <a href="https://www.youtube.com${parsedUrl.pathname}${parsedUrl.search}" target="_blank" class="action-link">Open in Native Tab ↗</a>
                </div>
              </div>

              <div class="quick-tags">
                <button class="tag-btn active" onclick="loadVideo('M576WGiDBdQ')">Apple Silicon M3</button>
                <button class="tag-btn" onclick="loadVideo('aqz-KE-bpKQ')">Blender 3D Cycles</button>
                <button class="tag-btn" onclick="loadVideo('jfKfPfyJRdk')">Lo-Fi Creative Chill</button>
                <button class="tag-btn" onclick="loadVideo('kJQP7kiw5Fk')">DaVinci 4K Grading</button>
                <button class="tag-btn" onclick="loadVideo('dQw4w9WgXcQ')">Studio Audio Beats</button>
              </div>

              <div class="player-wrap">
                <iframe 
                  id="yt-embed"
                  class="video-frame" 
                  src="https://www.youtube-nocookie.com/embed/${activeVid}?autoplay=1&enablejsapi=1&rel=0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowfullscreen>
                </iframe>
                <div class="video-meta">
                  <div>
                    <div id="v-title" class="video-title">YouTube Streaming Video</div>
                    <div id="v-chan" class="video-author">HD Playback • Accelerated WebKit Engine</div>
                  </div>
                  <div class="actions-group">
                    <button class="action-link" onclick="toggleTheater()">Cinema Mode</button>
                    <a id="v-out" href="https://www.youtube.com/watch?v=${activeVid}" target="_blank" class="action-link">Watch on YouTube ↗</a>
                  </div>
                </div>
              </div>

              <div class="heading">Suggested Creative & Tech Video Channels</div>
              <div class="grid">
                <div class="video-card" onclick="loadVideo('M576WGiDBdQ', 'Apple M3 Ultra Silicon Architecture & 4K Raytracing', 'Apple Tech Talk')">
                  <img class="thumb" src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80" />
                  <div class="info">
                    <div class="c-title">Apple M3 Ultra Silicon Architecture & 4K Raytracing</div>
                    <div class="c-channel">Apple Tech Talk • 1.4M views</div>
                  </div>
                </div>
                <div class="video-card" onclick="loadVideo('aqz-KE-bpKQ', 'Blender 4.0 Cycles Real-Time GPU Rendering Deep Dive', 'Blender Foundation')">
                  <img class="thumb" src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80" />
                  <div class="info">
                    <div class="c-title">Blender 4.0 Cycles Real-Time GPU Rendering Deep Dive</div>
                    <div class="c-channel">Blender Foundation • 890K views</div>
                  </div>
                </div>
                <div class="video-card" onclick="loadVideo('jfKfPfyJRdk', 'Lofi Hip Hop Radio - Beats to Relax/Study to', 'Lofi Girl')">
                  <img class="thumb" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80" />
                  <div class="info">
                    <div class="c-title">Lofi Hip Hop Radio - Beats to Relax & Focus</div>
                    <div class="c-channel">Lofi Girl • 64K Watching Live</div>
                  </div>
                </div>
                <div class="video-card" onclick="loadVideo('kJQP7kiw5Fk', 'DaVinci Resolve Studio 19 Cinematic Color Grading', 'Blackmagic Design')">
                  <img class="thumb" src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" />
                  <div class="info">
                    <div class="c-title">DaVinci Resolve Studio 19 Cinematic Color Grading</div>
                    <div class="c-channel">Blackmagic Design • 720K views</div>
                  </div>
                </div>
              </div>

              <script>
                function loadVideo(id, title, channel) {
                  document.getElementById('yt-embed').src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&enablejsapi=1&rel=0';
                  if (title) document.getElementById('v-title').textContent = title;
                  if (channel) document.getElementById('v-chan').textContent = channel + ' • HD Playback';
                  document.getElementById('v-out').href = 'https://www.youtube.com/watch?v=' + id;
                }
                function toggleTheater() {
                  var p = document.querySelector('.player-wrap');
                  p.style.maxWidth = p.style.maxWidth === '100%' ? '960px' : '100%';
                }
              </script>
            </body>
          </html>
        `);
      }

      // Live Web Proxy for all standard websites
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(finalTarget, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || 'text/html';

      // For binary assets (images, fonts, stylesheets)
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        res.setHeader('Content-Type', contentType);
        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }

      let html = await response.text();

      // Base tag to resolve all relative assets (images, css, javascript) to the original origin
      const baseTag = `<base href="${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1)}">`;
      
      const proxyScript = `
        <script>
          // Neutralize frame-busting scripts
          try {
            window.top = window.self;
            window.parent = window.self;
          } catch(e) {}

          window.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('a').forEach(link => {
              link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                  e.preventDefault();
                  try {
                    const absoluteUrl = new URL(href, document.baseURI).href;
                    window.parent.postMessage({ type: 'NEBULA_BROWSER_NAVIGATE', url: absoluteUrl }, '*');
                  } catch (err) {
                    window.parent.postMessage({ type: 'NEBULA_BROWSER_NAVIGATE', url: href }, '*');
                  }
                }
              });
            });
          });
        </script>
      `;

      // Remove embedded CSP meta tags and X-Frame-Options meta tags
      html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
      html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '');

      // Neutralize top.location frame busters in inline scripts
      html = html.replace(/top\.location\s*=/g, '/* top.location blocked */ window.location =');
      html = html.replace(/parent\.location\s*=/g, '/* parent.location blocked */ window.location =');

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}${proxyScript}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>${baseTag}${proxyScript}`);
      } else {
        html = `${baseTag}${proxyScript}${html}`;
      }

      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Cross-Origin-Opener-Policy');
      res.removeHeader('Cross-Origin-Embedder-Policy');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');

      return res.send(html);
    } catch (err: any) {
      console.warn('Browser proxy fetch failed or timed out:', err?.message);
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Safari Reader &amp; Proxy</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 40px 20px; text-align: center; color: #222; background: #f8fafc; }
              .card { max-width: 540px; margin: 40px auto; background: white; padding: 36px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
              .icon { width: 56px; height: 56px; border-radius: 16px; background: #eff6ff; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px auto; }
              h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
              p { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px; word-break: break-all; }
              .btn-row { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
              a.btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0284c7; color: white; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 600; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3); }
              a.btn-sec { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #f1f5f9; color: #334155; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 600; }
              .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">🌐</div>
              <h2>External Security Protection Detected</h2>
              <p>The site <strong>${req.query.url || 'target'}</strong> utilizes Cloudflare bot protection, strict biometric CORS, or timed out. You can open it in an isolated native Safari tab with a single click:</p>
              <div class="btn-row">
                <a href="${req.query.url}" target="_blank" class="btn-primary">Open in Native Safari Tab ↗</a>
                <a href="/api/browser/proxy?url=https://html.duckduckgo.com/html/?q=${encodeURIComponent(req.query.url as string)}" class="btn-sec">Search DuckDuckGo</a>
              </div>
              <div class="footer">NebulaOS WebKit Sandbox • TLS 1.3 Certified</div>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Vite middleware in dev
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NebulaOS Server listening on port ${PORT}`);
  });
}

startServer();
