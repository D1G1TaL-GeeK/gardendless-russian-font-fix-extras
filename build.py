from pathlib import Path
import argparse
import hashlib
import json
import re
import zipfile


ROOT = Path(__file__).resolve().parent
MODULES = ("paid-powerups.mjs", "layout-ui.mjs", "font-preview.mjs", "planning-boost.mjs")
DOCS = ("README.md", "README.ru.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "PUBLISHING.md")


def bundle():
    main = (ROOT / "src/main.mjs").read_text(encoding="utf-8")
    imports = re.findall(r'^import .* from "\./([^"\n]+)";\s*$', main, re.MULTILINE)
    if sorted(imports) != sorted(MODULES):
        raise ValueError("Unexpected source imports; update MODULES before building")
    main = re.sub(r'^import .* from "\./[^"\n]+";[ \t]*\n', "", main, flags=re.MULTILINE)
    if re.search(r"^\s*import\s+(?!\()", main, re.MULTILINE):
        raise ValueError("The GP-Next entry must not contain static imports")
    text = "\n\n".join((ROOT / "src" / name).read_text(encoding="utf-8").strip() for name in MODULES)
    return (text + "\n\n" + main.strip() + "\n").encode("utf-8")


def payload():
    manifest = json.loads((ROOT / "pack.json").read_text(encoding="utf-8"))
    if manifest["version"] != "1.0" or manifest["js"]["entry"] != "scripts/main.mjs":
        raise ValueError("Unexpected version or entry point")
    result = {"pack.json": (ROOT / "pack.json").read_bytes(), "scripts/main.mjs": bundle()}
    for name in DOCS:
        result[name] = (ROOT / name).read_bytes()
    for folder in ("assets/fonts", "examples"):
        for path in sorted((ROOT / folder).iterdir()):
            if path.is_file() and path.suffix in (".ttf", ".txt", ".json", ".png"):
                result[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    if len([name for name in result if name.endswith(".ttf")]) != 16:
        raise ValueError("All 16 font files must be included")
    if len([name for name in result if name.endswith("OFL.txt")]) != 15:
        raise ValueError("All 15 font licenses must be included")
    return result


def make_zip(path, files):
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(files.items()):
            item = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            item.compress_type = zipfile.ZIP_DEFLATED
            item.create_system = 3
            item.external_attr = 0o100644 << 16
            archive.writestr(item, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None:
            raise ValueError("Archive integrity check failed")


def main():
    parser = argparse.ArgumentParser(description="Build the GP-Next release and complete source archives")
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    release_files = payload()
    entry = ROOT / "scripts/main.mjs"
    entry.parent.mkdir(exist_ok=True)
    entry.write_bytes(release_files["scripts/main.mjs"])
    source_files = {name: data for name, data in release_files.items()}
    for name in ("build.py", ".gitignore", ".gitattributes", "PUBLISHING.md"):
        source_files[name] = (ROOT / name).read_bytes()
    for folder in ("src", "tests"):
        for path in sorted((ROOT / folder).glob("*.mjs")):
            source_files[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    entries = (
        ("Russian_Font_Display_Fix_Extras_1.0.zip", release_files),
        ("Russian_Font_Display_Fix_Extras_1.0_Source.zip", source_files),
    )
    lines = []
    for name, files in entries:
        target = output / name
        make_zip(target, files)
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        lines.append(f"{digest}  {name}\n")
        print(f"{name}: {len(files)} files, {target.stat().st_size} bytes")
    (output / "SHA256SUMS.txt").write_text("".join(lines), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
