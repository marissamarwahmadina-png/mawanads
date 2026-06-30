# Dockerfile untuk backend mawanads (dipakai Hugging Face Spaces / host Docker lain)
# HF Spaces mengekspos port 7860 secara default.
FROM python:3.11-slim

WORKDIR /app

# Install dependency
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Salin kode backend
COPY . .

# Folder upload (bukti transfer) — bersifat sementara di free tier
RUN mkdir -p /app/uploads

# Port (HF Spaces = 7860; bisa di-override lewat env PORT)
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-7860}"]
