import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export const supabaseAdmin = createClient(
    process.env.PROJECT_URL,
    process.env.SERVICE_ROLE_KEY
);

export const supabasePublic = createClient(
    process.env.PROJECT_URL,
    process.env.PUBLIC_ANON_KEY
);

