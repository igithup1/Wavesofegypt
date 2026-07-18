// This file exists solely to signal to Vercel's framework detector that
// the repository root is a Vite project, preventing Vercel from scanning
// subdirectories and auto-selecting artifacts/api-server as the project.
//
// The actual Vite build lives in artifacts/waves-of-egypt/vite.config.ts
// and is invoked by the vercel-build script in the root package.json.
import { defineConfig } from 'vite';
export default defineConfig({});
