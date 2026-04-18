import mongoose from "mongoose";

const connectDb = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to database");
    });
    await mongoose.connect(process.env.MONGO_URL, {
      family: 4,   // Force IPv4 (IMPORTANT)
    });

    console.log("Database connected successfully");
  } catch (error) {
    console.log("Error connecting to database:", error);
  }
};

export default connectDb; 