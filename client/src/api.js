// Small helper to call the backend
export async function api(path, method = "GET", body) {
  const token = localStorage.getItem("token");
  const res = await fetch("/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

// Download a file that needs login (submitted files, CSV report)
export async function download(path, filename) {
  const res = await fetch("/api" + path, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
  if (!res.ok) throw new Error("Could not download the file");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const readFile = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: String(r.result).split(",")[1] });
    r.onerror = () => reject(new Error("Could not read " + file.name));
    r.readAsDataURL(file);
  });
