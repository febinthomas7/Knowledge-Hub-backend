const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer, userId, albumId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `memory-map/${userId}/album_${albumId}`,
        resource_type: "auto",
        transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};
const UserModel = require("../Models/UserModel");
const MemoryModel = require("../Models/MemoryModel");
const AlbumModel = require("../Models/AlbumModel");

const uploadMemory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const {
      caption = "",
      lon = null,
      lat = null,
      location = "",
      date = null,
      id = "", // userId
      title = "", // album title
      albumId = "", // optional → existing albumId
    } = req.body;

    let album;
    let finalAlbumId = albumId;

    // ✅ 1. If no albumId or "new", create album first
    if (!albumId || albumId === "new") {
      const newAlbum = new AlbumModel({
        title,
        user: id,
        memories: [],
      });

      album = await newAlbum.save();
      finalAlbumId = album._id;

      // Link album back to user
      await UserModel.findByIdAndUpdate(id, {
        $push: { albums: album._id },
      });
    } else {
      album = await AlbumModel.findById(albumId);
      if (!album) {
        return res.status(404).json({ error: "Album not found" });
      }
    }

    // ✅ 2. Upload to Cloudinary (using albumId for folder organization)
    console.log("Uploading to Cloudinary...");
    const result = await uploadToCloudinary(req.file.buffer, id, finalAlbumId);

    // ✅ 3. Save memory
    const newMemory = new MemoryModel({
      url: result.secure_url,
      publicId: result.public_id,
      caption: caption.trim(),
      location: location,
      date: new Date(date),
      lat: lat,
      lon: lon,
      fileSize: result.bytes,
      originalName: req.file.originalname,
      user: id,
      album: finalAlbumId,
    });

    await newMemory.save();

    // ✅ 4. Link memory to user + album
    await UserModel.findByIdAndUpdate(id, {
      $push: { memories: newMemory._id },
    });

    await AlbumModel.findByIdAndUpdate(finalAlbumId, {
      $push: { memories: newMemory._id },
    });

    res.status(200).json({
      _id: newMemory._id,
      url: newMemory.url,
      caption: newMemory.caption,
      location: newMemory.location,
      lat: newMemory.lat,
      lon: newMemory.lon,
      date: date,
      uploadDate: newMemory.uploadDate,
      album: {
        _id: album._id,
        title: album.title,
      },
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to upload image",
      details: error.message,
    });
  }
};

const deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const memory = await MemoryModel.findById(id);

    if (!memory) {
      return res.status(404).json({ error: "Memory not found" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(memory.publicId);

    // Remove reference from albums (memories array)
    await AlbumModel.updateMany({ memories: id }, { $pull: { memories: id } });
    await UserModel.updateMany({ memories: id }, { $pull: { memories: id } });

    // Delete from MongoDB (Memory collection)
    await MemoryModel.findByIdAndDelete(id);

    res.json({ message: "Memory deleted successfully", success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      error: "Failed to delete memory",
      details: error.message,
    });
  }
};

const getMemory = async (req, res) => {
  const { userId } = req.query;
  try {
    const images = await UserModel.findById(userId)
      .populate({
        path: "memories",
        options: { sort: { uploadDate: -1 } }, // sort by latest
        select:
          "caption  lon   lat url location  date   id   title  title updatedAt _id", // select fields
      })
      .select("memories");

    res.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({
      error: "Failed to fetch images",
      details: error.message,
    });
  }
};

// const getAlbums = async (req, res) => {
//   const { userId, page = 1, limit = 10 } = req.query;
//   try {
//     const images = await UserModel.findById(userId)
//       .populate({
//         path: "albums",
//         options: { sort: { uploadDate: -1 } }, // sort by latest
//         select: "title updatedAt _id", // select fields
//       })
//       .select("albums");

//     res.json(images);
//   } catch (error) {
//     console.error("Error fetching images:", error);
//     res.status(500).json({
//       error: "Failed to fetch images",
//       details: error.message,
//     });
//   }
// };

const getAlbums = async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.query;

  try {
    const skip = (page - 1) * limit;

    // First count total albums for pagination info
    const user = await UserModel.findById(userId).select("albums");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalAlbums = user.albums.length;

    // Fetch paginated albums
    const albums = await UserModel.findById(userId)
      .populate({
        path: "albums",
        options: {
          sort: { updatedAt: -1 }, // latest first
          skip: skip,
          limit: parseInt(limit),
        },
        select: "title updatedAt _id",
      })
      .select("albums");

    res.json({
      totalAlbums,
      totalPages: Math.ceil(totalAlbums / limit),
      currentPage: parseInt(page),
      albums: albums.albums,
    });
  } catch (error) {
    console.error("Error fetching albums:", error);
    res.status(500).json({
      error: "Failed to fetch albums",
      details: error.message,
    });
  }
};

const getSingleAlbum = async (req, res) => {
  const { userId } = req.query; // still pass userId for ownership
  const { albumId } = req.params;

  try {
    const user = await UserModel.findById(userId)
      .populate({
        path: "albums",
        match: { _id: albumId }, // only fetch the matching album
        populate: {
          path: "memories", // populate images inside album
          options: { sort: { uploadDate: -1 } },
          select: "url caption location date  _id",
        },
        select: "title  updatedAt _id",
      })
      .select("albums");

    if (!user || !user.albums.length) {
      return res.status(404).json({ error: "Album not found" });
    }

    res.json(user.albums[0]); // return just the single album
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({
      error: "Failed to fetch album",
      details: error.message,
    });
  }
};

const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await AlbumModel.findById(id).populate("memories");

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    // 1. Delete all resources from Cloudinary in one shot
    await cloudinary.api.delete_resources_by_prefix(
      `memory-map/${album.user}/album_${id}`
    );

    // 2. Delete the folder itself (only if empty now)
    await cloudinary.api.delete_folder(`memory-map/${album.user}/album_${id}`);

    // 3. Delete all memories in DB
    const memoryIds = album.memories.map((m) => m._id);
    if (memoryIds.length > 0) {
      await MemoryModel.deleteMany({ _id: { $in: memoryIds } });

      // Remove memory references from users
      await UserModel.updateMany(
        {},
        { $pull: { memories: { $in: memoryIds } } }
      );
    }

    // 4. Remove album reference from all users
    await UserModel.updateMany({ albums: id }, { $pull: { albums: id } });

    // 5. Delete the album itself
    await AlbumModel.findByIdAndDelete(id);

    res.json({ message: "Album deleted successfully" });
  } catch (error) {
    console.error("Delete album error:", error);
    res.status(500).json({
      error: "Failed to delete album",
      details: error.message,
    });
  }
};

const editMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, date } = req.body;

    const image = await MemoryModel.findById(id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    let updatedUrl = image.url;
    let updatedPublicId = image.publicId;

    // If a new image file is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }

      const uploadRes = await uploadToCloudinary(
        req.file.buffer,
        image.user,
        image.album
      );

      updatedUrl = uploadRes.secure_url;
      updatedPublicId = uploadRes.public_id;
    }

    // Update MongoDB
    const updatedImage = await MemoryModel.findByIdAndUpdate(
      id,
      {
        caption: caption || image.caption,
        url: updatedUrl,
        date: date || image.date,
        publicId: updatedPublicId,
      },
      { new: true }
    );

    res.json({ message: "Image updated successfully", updatedImage });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: "Failed to update image",
      details: error.message,
    });
  }
};

const editAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const album = await AlbumModel.findById(id);
    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    album.title = title;
    const updatedAlbum = await album.save(); // save changes

    res.json({ message: "Album updated successfully", updatedAlbum });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: "Failed to update Album",
      details: error.message,
    });
  }
};

const editUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio } = req.body; // avatar = base64 or image URL

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio) updateFields.bio = bio;

    // if avatar is sent
    if (req.file) {
      // 1. Delete old avatar from Cloudinary (if exists)
      if (user.publicId) {
        try {
          await cloudinary.uploader.destroy(user.publicId);
        } catch (err) {
          console.warn("Failed to delete old avatar:", err.message);
        }
      }

      const uploadResponse = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );

      updateFields.avatar = uploadResponse.secure_url; // save Cloudinary URL
      updateFields.publicId = uploadResponse.public_id; // save Cloudinary URL
    }

    // 3. Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: "Failed to update user",
      details: error.message,
    });
  }
};
module.exports = {
  uploadMemory,
  deleteMemory,
  getAlbums,
  getSingleAlbum,
  editMemory,
  editAlbum,
  deleteAlbum,
  editUserProfile,
  getMemory,
};
