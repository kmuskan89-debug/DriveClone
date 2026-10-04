const express = require("express");
const router = express.Router();

const supabase = require("../config/supabase");
const upload = require("../config/upload");
const fileModel = require("../models/file.model");
const authMiddleware = require("../middlewares/auth");

router.get("/home", authMiddleware, async (req, res) => {
  const userFiles = await fileModel.find({
    user: req.user.userId,
  });

  res.render("home", {
    files: userFiles,
  });
});

router.post(
  "/upload-file",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file selected for upload.");
      }

      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueFileName = `${Date.now()}_${safeName}`;

      // 1. Upload the file itself to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("drive-files")
        .upload(uniqueFileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (storageError) {
        console.error("Supabase Storage Error:", storageError);
        throw storageError;
      }

      // 2. Save the file's details in MongoDB
      try {
        await fileModel.create({
          path: storageData.path,
          originalName: req.file.originalname,
          user: req.user.userId,
          size: req.file.size,
          mimeType: req.file.mimetype,
        });
      } catch (dbError) {
        // remove the uploaded file so it isn't orphaned in the bucket
        await supabase.storage.from("drive-files").remove([storageData.path]);
        throw dbError;
      }

      // 3. Only after both steps succeed
      res.redirect("/home");
    } catch (error) {
      console.error("Upload Process Failed:", error);
      res.status(500).send("An error occurred while uploading your file.");
    }
  },
);

router.get("/download/:path", authMiddleware, async (req, res) => {
  const loggedInUserId = req.user.userId;
  const path = req.params.path;
  try {
    const file = await fileModel.findOne({
      user: loggedInUserId,
      path: path,
    });

    if (!file) {
      return res.status(401).json({
        message: "Unauthorised",
      });
    }

    const { data, error } = await supabase.storage
      .from("drive-files")
      .createSignedUrl(file.path, 60, { download: file.originalName });

    if (error) {
      throw error;
    }
    res.redirect(data.signedUrl);
  } catch (error) {
    console.error("Download Failed:", error);
    res.status(500).send("Could not download the file.");
  }
});

router.get("/delete/:path", authMiddleware, async (req, res) => {
  const LoggedInUserId = req.user.userId;
  const path = req.params.path;
  try {
    const file = await fileModel.findOne({
      user: LoggedInUserId,
      path: path,
    });

    if (!file) {
      return res.status(401).json({
        message: "Unauthorised",
      });
    }
    const error = await supabase.storage
      .from("drive-files")
      .remove([file.path]);

    if (error) {
      throw error;
    }
    await file.deleteOne();

    res.redirect("/home");
  } catch (error) {
    console.error("Delete Failed:", error);
    res.status(500).send("Could not delete the file.");
  }
});

module.exports = router;
