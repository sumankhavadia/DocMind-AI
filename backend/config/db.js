const mongoose = require("mongoose");


const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/docmind";

  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI not set; using local mongodb://localhost:27017/docmind");
  }

  try {
    await mongoose.connect(uri, {
      dbName: "docmind",
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;
