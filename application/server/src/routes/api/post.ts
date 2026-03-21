import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

// GET /posts のレスポンスを 5 秒間キャッシュ（タイムライン初期表示の TTFB 短縮）
const postsCache = new Map<string, { body: string; expireAt: number }>();

postRouter.get("/posts", async (req, res) => {
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : 30;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : 0;
  const key = `${limit}:${offset}`;
  const now = Date.now();

  const cached = postsCache.get(key);
  if (cached != null && cached.expireAt > now) {
    return res.status(200).type("application/json").send(cached.body);
  }

  const posts = await Post.findAll({ limit, offset });
  const body = JSON.stringify(posts);

  postsCache.set(key, { body, expireAt: now + 5000 });

  return res.status(200).type("application/json").send(body);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const posts = await Comment.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
    where: {
      postId: req.params.postId,
    },
  });

  return res.status(200).type("application/json").send(posts);
});

postRouter.post("/posts", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  postsCache.clear();

  const post = await Post.create(
    {
      ...req.body,
      userId: req.session.userId,
    },
    {
      include: [
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
    },
  );

  return res.status(200).type("application/json").send(post);
});
