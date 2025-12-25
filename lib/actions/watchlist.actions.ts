"use server";

import { connectToDB } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

export const getWatchlistSymbolsByEmail = async (
  email: string
): Promise<string[]> => {
  try {
    const mongoose = await connectToDB();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Database connection failed");

    // Find user by email in the Better Auth 'users' collection
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return [];
    }

    const userId = user.id || user._id.toString();

    // Query watchlist for the found user
    const watchlistItems = await Watchlist.find({ userId })
      .select("symbol")
      .lean();

    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error("Error fetching watchlist symbols by email:", error);
    return [];
  }
};
