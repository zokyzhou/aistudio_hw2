import mongoose from "mongoose";

// read env lazily inside connectDB to avoid crashing at import time
const MONGODB_DB = process.env.MONGODB_DB || "carbon_market";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const cached =
  global.mongooseCache ??
  (global.mongooseCache = { conn: null, promise: null });

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI");
  }

  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
