export const displayName = (filename : string): string=> {

    const nameParts = filename.split("."); // base + ext
    const ext = nameParts.pop();
    const base = nameParts.join(".");


    return base.length > 6
    ? `${base.slice(0, 6)}... .${ext}`
    : `${base}.${ext}`;
}