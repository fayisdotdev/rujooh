# #!/usr/bin/env python3
# """
# react_map.py - map pages, modules, routes and connections in a React project.

# Usage:
#     python react_map.py                 # run from inside the project folder
#     python react_map.py path/to/app     # or point it at the project folder

# Creates react_project_map.txt inside the project folder.
# """

import os
import re
import sys
from collections import defaultdict

EXTENSIONS = {".js", ".jsx", ".ts", ".tsx"}
IGNORE_DIRS = {"node_modules", "build", "dist", "coverage", ".next", ".git", ".cache"}
PAGE_DIR_NAMES = {"pages", "page", "views", "screens", "routes"}
PAGE_SUFFIXES = ("Page", "Screen", "View")
RESOLVE_SUFFIXES = ["", ".js", ".jsx", ".ts", ".tsx",
                    "/index.js", "/index.jsx", "/index.ts", "/index.tsx"]
EXPORT_KEYWORDS = {"function", "class", "async", "const", "let", "var"}

IMPORT_FROM_RE = re.compile(r"import\s+([^;'\"]*?)\s+from\s+['\"]([^'\"]+)['\"]")
IMPORT_SIDE_RE = re.compile(r"import\s+['\"]([^'\"]+)['\"]")
REQUIRE_RE = re.compile(r"(?:import|require)\s*\(\s*['\"]([^'\"]+)['\"]\s*\)")
EXPORT_FROM_RE = re.compile(r"export\s+[^;'\"]*?from\s+['\"]([^'\"]+)['\"]")
EXPORT_NAME_RE = re.compile(r"export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)")
EXPORT_DEFAULT_RE = re.compile(r"export\s+default\s+(\w+)")
ROUTE_RE = re.compile(
    r"<Route\b[^>]*?path=\{?\s*['\"`]([^'\"`]+)['\"`]"
    r"[^>]*?(?:element=\{\s*<\s*(\w+)|component=\{\s*(\w+)|Component=\{\s*(\w+))",
    re.DOTALL,
)
LINK_RE = re.compile(
    r"""(?:to|href)\s*=\s*\{?\s*['"`](/[^'"`]*)['"`]|navigate\(\s*['"`](/[^'"`]*)['"`]"""
)


def find_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith(".")]
        for name in filenames:
            if os.path.splitext(name)[1] in EXTENSIONS:
                yield os.path.join(dirpath, name)


def read(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        return f.read()


def strip_comments(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", text)


def rel(path, root):
    return os.path.relpath(path, root).replace(os.sep, "/")


def is_local(spec):
    return spec.startswith((".", "@/", "~/", "src/"))


def package_name(spec):
    parts = spec.split("/")
    return "/".join(parts[:2]) if spec.startswith("@") else parts[0]


def parse_import_clause(clause):
    """Return (default_name, {imported_name: local_name})."""
    named = {}
    m = re.search(r"\{([^}]*)\}", clause)
    if m:
        for item in m.group(1).split(","):
            item = item.strip()
            if not item:
                continue
            parts = re.split(r"\s+as\s+", item)
            named[parts[0].strip()] = parts[-1].strip()
    rest = clause[:m.start()] + clause[m.end():] if m else clause
    default = None
    if "*" not in rest:
        tokens = [t for t in re.findall(r"\w+", rest) if t not in ("type", "as")]
        default = tokens[0] if tokens else None
    return default, named


def resolve(spec, from_file, root, src_root, file_set):
    if spec.startswith("."):
        base = os.path.join(os.path.dirname(from_file), spec)
    elif spec.startswith(("@/", "~/")):
        base = os.path.join(src_root, spec[2:])
    elif spec.startswith("src/"):
        base = os.path.join(root, spec)
    else:
        return None
    base = os.path.normpath(base)
    for suffix in RESOLVE_SUFFIXES:
        candidate = base + suffix
        if candidate in file_set:
            return candidate
    return None


def find_by_stem(name, mods):
    if not name:
        return None
    for p in mods:
        if os.path.splitext(os.path.basename(p))[0] == name:
            return p
    return None


def norm_path(p):
    return p.rstrip("/") or "/"


def fmt_list(items, root, indent=18):
    if not items:
        return "-"
    return ("\n" + " " * indent).join(sorted(rel(x, root) for x in items))


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.getcwd())
    src_root = os.path.join(root, "src") if os.path.isdir(os.path.join(root, "src")) else root

    files = sorted(find_files(root))
    file_set = set(files)
    mods = {}

    # 1. Parse every file
    for path in files:
        text = strip_comments(read(path))
        specs = [(m.group(2), m.group(1)) for m in IMPORT_FROM_RE.finditer(text)]
        for pattern in (IMPORT_SIDE_RE, REQUIRE_RE, EXPORT_FROM_RE):
            specs += [(m.group(1), None) for m in pattern.finditer(text)]

        mod = {"imports": set(), "names": {}, "externals": set(), "links": set(),
               "exports": set(), "routes_raw": []}

        for spec, clause in specs:
            target = resolve(spec, path, root, src_root, file_set)
            if target is None:
                if not is_local(spec):
                    mod["externals"].add(package_name(spec))
                continue
            mod["imports"].add(target)
            if clause:
                default, named = parse_import_clause(clause)
                if default:
                    mod["names"][default] = target
                for local in named.values():
                    mod["names"][local] = target

        exports = set(EXPORT_NAME_RE.findall(text)) | set(EXPORT_DEFAULT_RE.findall(text))
        mod["exports"] = exports - EXPORT_KEYWORDS
        mod["links"] = {a or b for a, b in LINK_RE.findall(text)}
        mod["routes_raw"] = ROUTE_RE.findall(text)
        mods[path] = mod

    # 2. Routes: path -> component -> file
    route_table = []
    for path, mod in mods.items():
        for rpath, *comps in mod["routes_raw"]:
            comp = next((c for c in comps if c), "")
            target = mod["names"].get(comp) or find_by_stem(comp, mods)
            route_table.append((rpath, comp, target, path))

    route_lookup = {norm_path(r): t for r, _, t, _ in route_table if t}
    route_targets = {t for _, _, t, _ in route_table if t}

    # 3. Pages
    def is_page(p):
        parts = set(rel(p, root).split("/")[:-1])
        stem = os.path.splitext(os.path.basename(p))[0]
        return bool(parts & PAGE_DIR_NAMES) or stem.endswith(PAGE_SUFFIXES) or p in route_targets

    pages = {p for p in mods if is_page(p)}

    importers = defaultdict(set)
    for p, mod in mods.items():
        for t in mod["imports"]:
            importers[t].add(p)

    route_for = defaultdict(list)
    for rpath, _, target, _ in route_table:
        if target:
            route_for[target].append(rpath)

    # 4. Build report
    out = []
    add = out.append

    add("REACT PROJECT MAP")
    add("=" * 60)
    add(f"Project folder : {root}")
    add(f"Source folder  : {rel(src_root, root) if src_root != root else '.'}")
    add(f"Files scanned  : {len(files)}")
    add(f"Pages found    : {len(pages)}")
    add("")

    add("ROUTES")
    add("-" * 60)
    if route_table:
        for rpath, comp, target, decl in sorted(route_table):
            where = rel(target, root) if target else "(component file not resolved)"
            add(f"{rpath:<25} -> {comp:<20} {where}")
            add(f"{'':<25}    declared in {rel(decl, root)}")
    else:
        add("No <Route path=... element=...> found. Routes may use createBrowserRouter or another style.")
    add("")

    add("PAGES")
    add("-" * 60)
    for p in sorted(pages):
        exp = ", ".join(sorted(mods[p]["exports"])) or "-"
        add(f"  {rel(p, root)}")
        add(f"      exports: {exp}")
    add("")

    add("PAGE CONNECTIONS (page -> page)")
    add("-" * 60)
    any_conn = False
    for p in sorted(pages):
        mod = mods[p]
        conns = {t: "import" for t in mod["imports"] if t in pages}
        for link in mod["links"]:
            t = route_lookup.get(norm_path(link))
            if t and t in pages:
                conns.setdefault(t, "navigation link")
        if conns:
            any_conn = True
            add(f"{rel(p, root)}")
            for t, how in sorted(conns.items(), key=lambda x: rel(x[0], root)):
                add(f"    -> {rel(t, root)}   ({how})")
    if not any_conn:
        add("No page-to-page connections detected.")
    add("")

    add("MODULE DETAILS")
    add("-" * 60)
    for p in files:
        mod = mods[p]
        stem = os.path.splitext(os.path.basename(p))[0]
        nav = []
        for link in sorted(mod["links"]):
            t = route_lookup.get(norm_path(link))
            nav.append(f"{link} -> {rel(t, root) if t else 'unknown'}")
        add(f"[{stem}]  {rel(p, root)}")
        add(f"    type      : {'PAGE' if p in pages else 'module'}")
        add(f"    exports   : {', '.join(sorted(mod['exports'])) or '-'}")
        add(f"    routes to : {', '.join(sorted(route_for[p])) or '-'}")
        add(f"    imports   : {fmt_list(mod['imports'], root)}")
        add(f"    used by   : {fmt_list(importers[p], root)}")
        add(f"    nav links : {(chr(10) + ' ' * 18).join(nav) if nav else '-'}")
        add("")

    add("EXTERNAL PACKAGES")
    add("-" * 60)
    ext_count = defaultdict(int)
    for mod in mods.values():
        for e in mod["externals"]:
            ext_count[e] += 1
    for name, count in sorted(ext_count.items(), key=lambda x: (-x[1], x[0])):
        add(f"  {name:<30} used in {count} file(s)")
    if not ext_count:
        add("  None detected.")

    out_path = os.path.join(root, "react_project_map.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")

    print(f"Done. Report written to: {out_path}")
    print(f"Scanned {len(files)} files, found {len(pages)} pages and {len(route_table)} routes.")


if __name__ == "__main__":
    main()