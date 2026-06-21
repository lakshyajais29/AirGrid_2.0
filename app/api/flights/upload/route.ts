// "use server" – API route to receive a CSV upload and replace the stored flights data
"use server"

import { promises as fs } from "fs"
import { join } from "path"

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get("file") as Blob | null
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
    // Read the uploaded file as a Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    // Ensure the data directory exists
    const dataDir = join(process.cwd(), "skyvigil", "data")
    await fs.mkdir(dataDir, { recursive: true })
    const csvPath = join(dataDir, "flights.csv")
    await fs.writeFile(csvPath, buffer)
    return new Response(JSON.stringify({ message: "CSV uploaded successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
