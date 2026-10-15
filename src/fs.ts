export async function fileExists(path: string): Promise<boolean> {
    try {
        return await Bun.file(path).exists();
    } catch {
        return false;
    }
}


