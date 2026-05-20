import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  taskAttachment: f({ pdf: { maxFileSize: "8MB" }, image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      return { userId: "user-placeholder" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
