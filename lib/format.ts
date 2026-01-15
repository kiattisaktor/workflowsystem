export function formatName(name: string): string {
    if (!name) return "";
    // Check for "Name (Nick)" pattern
    const match = name.match(/\(([^)]+)\)/);
    if (match && match[1]) {
        return match[1];
    }
    return name;
}
