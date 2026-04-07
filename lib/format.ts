export function formatName(name: string): string {
    if (!name) return "";
    // Check for "Name (Nick)" pattern
    const match = name.match(/\(([^)]+)\)/);
    if (match && match[1]) {
        return match[1].trim();
    }
    return name.trim();
}

export function formatDate(dateStr: string): string {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    
    // Convert to BE year and take last 2 digits
    const beYear = (parseInt(y) + 543).toString().slice(-2);
    return `${d}/${m}/${beYear}`;
}

export function formatDateFull(dateStr: string): string {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    
    // Convert to BE year (4 digits)
    const beYear = (parseInt(y) + 543).toString();
    return `${d}/${m}/${beYear}`;
}
