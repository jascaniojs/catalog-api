import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export type ConfigProps = {
    AWS_REGION: string;
    NODE_ENV: string;
    DYNAMODB_ENDPOINT?: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    OPENAI_API_KEY: string;
    OPENAI_MODEL: string;
    GEMINI_API_KEY: string;
    GEMINI_MODEL: string;
};

export const getConfig = (): ConfigProps => ({
    AWS_REGION: process.env.AWS_REGION || "us-east-1",
    NODE_ENV: process.env.NODE_ENV || "",
    DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT || "http://dynamodb-local:8080",
    JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production-min-32-characters-long",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
});