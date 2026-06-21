// "use client" – upload UI runs in the browser
"use client"

import React, { useState } from "react"

export default function UploadFlightsPage() {
  const [status, setStatus] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setStatus("Uploading…")
    try {
      const res = await fetch("/api/flights/upload", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (res.ok) setStatus(json.message)
      else setStatus(json.error || "Upload failed")
    } catch (err) {
      setStatus("Network error")
    }
  }

  return (
    <div className="min-h-screen bg-light-bg p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-semibold text-navy mb-4">Upload Flights CSV</h1>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-4">
            <input type="file" name="file" accept=".csv" required className="w-full text-sm" />
          </div>
          <button type="submit" className="px-4 py-2 bg-navy text-white rounded hover:bg-mid-blue">
            Upload
          </button>
        </form>
        {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
      </div>
    </div>
  )
}
