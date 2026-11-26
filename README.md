# document-labeler-ui

Camera / file-upload UI for the [document-labeler](https://github.com/Shriraman-Hegde/document-labeler) API.

This repo is **frontend only**. The Go OCR engine and HTTP API live in `document-labeler`.

## Run locally

1. Start the API:

```bash
cd ../document-labeler
DIGITIZER_ALLOW_STUB=1 ./bin/digitizer serve --addr :8091 --root .
```

2. Serve this UI (any static server):

```bash
python3 -m http.server 5173
```

3. Open http://127.0.0.1:5173  
   Set **API base** to `http://127.0.0.1:8091` (saved in `localStorage`, or pass `?api=http://127.0.0.1:8091`).

## API contract

- `POST {API}/v1/scan` — multipart: `dept`, optional `mode`, `file`
- `GET {API}/v1/relate?dept=…`
- `GET {API}/health`

CORS is enabled on the API for browser calls from this origin.
