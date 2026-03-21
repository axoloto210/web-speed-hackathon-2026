import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import { imageOptimizeRouter } from "@web-speed-hackathon-2026/server/src/routes/image_optimize";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

// 画像は WebP リサイズ配信（SPA フォールバックより前に処理する）
staticRouter.use(imageOptimizeRouter);

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: true,
    lastModified: true,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: true,
    lastModified: true,
  }),
);
