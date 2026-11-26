(() => {
  const params = new URLSearchParams(location.search);
  const API =
    params.get("api") ||
    localStorage.getItem("DIGITIZER_API") ||
    "http://127.0.0.1:8091";

  const preview = document.getElementById("preview");
  const snap = document.getElementById("snap");
  const still = document.getElementById("still");
  const fallback = document.getElementById("cam-fallback");
  const dept = document.getElementById("dept");
  const mode = document.getElementById("mode");
  const apiInput = document.getElementById("api");
  const status = document.getElementById("status");
  const results = document.getElementById("results");
  const out = document.getElementById("out");
  const btnCam = document.getElementById("btn-cam");
  const btnShot = document.getElementById("btn-shot");
  const btnScan = document.getElementById("btn-scan");
  const fileInput = document.getElementById("file");

  let stream = null;
  let pendingBlob = null;

  apiInput.value = API;

  function apiBase() {
    const v = (apiInput.value || "").trim().replace(/\/$/, "");
    localStorage.setItem("DIGITIZER_API", v);
    return v;
  }

  function setStatus(msg) {
    status.textContent = msg || "";
  }

  function showStill(url) {
    still.src = url;
    still.hidden = false;
    preview.hidden = true;
    fallback.hidden = true;
  }

  async function enableCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      preview.srcObject = stream;
      preview.hidden = false;
      still.hidden = true;
      fallback.hidden = true;
      btnShot.disabled = false;
      setStatus("Camera ready.");
    } catch (err) {
      setStatus("Camera unavailable — use Upload file. " + (err && err.message ? err.message : ""));
    }
  }

  function captureFrame() {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    const w = settings.width || preview.videoWidth || 1280;
    const h = settings.height || preview.videoHeight || 720;
    snap.width = w;
    snap.height = h;
    const ctx = snap.getContext("2d");
    ctx.drawImage(preview, 0, 0, w, h);
    snap.toBlob((blob) => {
      if (!blob) {
        setStatus("Capture failed.");
        return;
      }
      pendingBlob = blob;
      showStill(URL.createObjectURL(blob));
      btnScan.disabled = false;
      setStatus("Frame captured — press Scan.");
    }, "image/jpeg", 0.92);
  }

  fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    pendingBlob = f;
    btnScan.disabled = false;
    if (f.type.startsWith("image/")) {
      showStill(URL.createObjectURL(f));
    } else {
      still.hidden = true;
      preview.hidden = true;
      fallback.hidden = false;
      fallback.textContent = "PDF ready: " + f.name;
    }
    setStatus("File selected — press Scan.");
  });

  async function scan() {
    if (!pendingBlob) {
      setStatus("Capture or upload a document first.");
      return;
    }
    if (!dept.value.trim()) {
      setStatus("Department is required.");
      return;
    }
    const base = apiBase();
    if (!base) {
      setStatus("API base URL is required.");
      return;
    }
    btnScan.disabled = true;
    setStatus("Scanning…");
    const body = new FormData();
    body.append("dept", dept.value.trim());
    if (mode.value) body.append("mode", mode.value);
    body.append("file", pendingBlob, pendingBlob.name || "capture.jpg");

    try {
      const res = await fetch(base + "/v1/scan", { method: "POST", body });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || res.statusText);
      }
      if (!res.ok) {
        throw new Error(data.error || text || res.statusText);
      }
      results.hidden = false;
      out.textContent = JSON.stringify(data, null, 2);
      const doc = (data.documents && data.documents[0]) || {};
      setStatus(doc.rescan ? "Rescan needed." : (doc.message || "Done."));
    } catch (err) {
      setStatus("Scan failed: " + (err && err.message ? err.message : String(err)));
    } finally {
      btnScan.disabled = !pendingBlob;
    }
  }

  btnCam.addEventListener("click", enableCamera);
  btnShot.addEventListener("click", captureFrame);
  btnScan.addEventListener("click", scan);
  apiInput.addEventListener("change", () => apiBase());
})();
