"""
Utilities for file storage with Tigris
"""

import os
import uuid
from pathlib import Path

import httpx
from fastapi import UploadFile


class TigrisStorage:
    """Storage client for Tigris"""

    def __init__(self):
        self.tigris_url = os.getenv("TIGRIS_URL", "http://localhost:8081")
        self.tigris_project = os.getenv("TIGRIS_PROJECT", "conversme")
        self.bucket_name = os.getenv("TIGRIS_BUCKET", "media")
        self.api_url = f"{self.tigris_url}/v1/projects/{self.tigris_project}/database/search/collections"
        self.use_local_fallback = os.getenv("USE_LOCAL_STORAGE", "True").lower() == "true"

        # Ensure uploads directory exists for local fallback
        if self.use_local_fallback:
            self.uploads_dir = Path("uploads")
            if not self.uploads_dir.exists():
                self.uploads_dir.mkdir(parents=True)

    async def upload_file(self, file: UploadFile) -> tuple[str, str]:
        """
        Upload a file to Tigris or local storage

        Args:
            file: The file to upload

        Returns:
            Tuple of (file_id, url)
        """
        file_id = str(uuid.uuid4())
        file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
        filename = f"{file_id}.{file_extension}"

        # Try using Tigris if enabled
        if not self.use_local_fallback:
            try:
                return await self._upload_to_tigris(file, filename, file_id)
            except Exception as e:
                # Fall back to local storage if Tigris fails
                print(f"Tigris upload failed: {e}, falling back to local storage")
                return await self._upload_local(file, filename, file_id)

        # Use local storage by default
        return await self._upload_local(file, filename, file_id)

    async def _upload_to_tigris(self, file: UploadFile, filename: str, file_id: str) -> tuple[str, str]:
        """Upload file to Tigris storage"""
        contents = await file.read()

        # Reset file position for possible reuse
        await file.seek(0)

        # Upload to Tigris
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.tigris_url}/v1/projects/{self.tigris_project}/bucket/{self.bucket_name}/files/{filename}",
                content=contents,
                headers={"Content-Type": file.content_type}
            )

            if response.status_code != 201:
                raise Exception(f"Failed to upload to Tigris: {response.text}")

        # URL for accessing the file
        url = f"{self.tigris_url}/v1/projects/{self.tigris_project}/bucket/{self.bucket_name}/files/{filename}"
        return file_id, url

    async def _upload_local(self, file: UploadFile, filename: str, file_id: str) -> tuple[str, str]:
        """Upload file to local storage as fallback"""
        file_path = self.uploads_dir / filename

        # Copy file to uploads directory
        contents = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        # Reset file position for possible reuse
        await file.seek(0)

        # URL for accessing the file
        url = f"/uploads/{filename}"
        return file_id, url

    async def delete_file(self, url: str) -> bool:
        """
        Delete a file from storage

        Args:
            url: The file URL

        Returns:
            True if successful, False otherwise
        """
        # Handle local files
        if url.startswith("/uploads/"):
            try:
                file_path = Path(url.replace("/uploads/", "uploads/"))
                if file_path.exists():
                    file_path.unlink()
                return True
            except Exception as e:
                print(f"Failed to delete local file: {e}")
                return False

        # Handle Tigris files
        else:
            try:
                filename = url.split("/")[-1]
                async with httpx.AsyncClient() as client:
                    response = await client.delete(
                        f"{self.tigris_url}/v1/projects/{self.tigris_project}/bucket/{self.bucket_name}/files/{filename}"
                    )
                return response.status_code == 200
            except Exception as e:
                print(f"Failed to delete Tigris file: {e}")
                return False


# Create a singleton instance
storage = TigrisStorage()
