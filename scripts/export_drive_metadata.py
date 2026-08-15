"""Export the IT-SUM Drive tree through gws without modifying Drive."""
import json
import subprocess
import sys
from pathlib import Path

FOLDER_MIME = "application/vnd.google-apps.folder"
ROOT_ID = "10bpMPWKQ4EJ6UWEBwysqNdTEC6Tsh6B2"


def list_children(folder_id: str) -> list[dict]:
    params = {
        "q": f"'{folder_id}' in parents and trashed=false",
        "fields": "files(id,name,mimeType,size,md5Checksum,modifiedTime,createdTime,parents,webViewLink,trashed,videoMediaMetadata/durationMillis)",
        "pageSize": 1000,
        "orderBy": "folder,name_natural",
        "supportsAllDrives": True,
        "includeItemsFromAllDrives": True,
    }
    proc = subprocess.run(
        ["gws", "drive", "files", "list", "--params", json.dumps(params), "--format", "json"],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Drive listing failed for {folder_id}: {proc.stderr[:400]}")
    return json.loads(proc.stdout).get("files", [])


def walk(folder_id: str, path: str, folders: list[dict], files: list[dict]) -> None:
    children = list_children(folder_id)
    for item in children:
        current_path = f"{path}/{item['name']}" if path else item["name"]
        if item.get("mimeType") == FOLDER_MIME:
            folders.append({
                "id": item["id"],
                "name": item.get("name", ""),
                "path": current_path,
                "parentId": folder_id,
                "mimeType": item["mimeType"],
            })
            walk(item["id"], current_path, folders, files)
        else:
            files.append({
                "id": item["id"],
                "name": item.get("name", ""),
                "path": current_path,
                "parentId": folder_id,
                "mimeType": item.get("mimeType", "application/octet-stream"),
                "size": int(item["size"]) if item.get("size") else None,
                "md5Checksum": item.get("md5Checksum"),
                "modifiedTime": item.get("modifiedTime"),
                "createdTime": item.get("createdTime"),
                "webViewLink": item.get("webViewLink"),
                "trashed": bool(item.get("trashed", False)),
                "durationMillis": (item.get("videoMediaMetadata") or {}).get("durationMillis"),
            })


if __name__ == "__main__":
    output = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/ubuntu/it-sum/supabase/seed/drive_metadata.json")
    folders: list[dict] = []
    files: list[dict] = []
    walk(ROOT_ID, "ملخصات قسم IT", folders, files)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"rootId": ROOT_ID, "folders": folders, "files": files}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"folders": len(folders), "files": len(files), "output": str(output)}, ensure_ascii=False))
