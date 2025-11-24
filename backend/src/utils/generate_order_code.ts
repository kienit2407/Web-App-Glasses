export const generateOrderNumber = () => {
    const datePart = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
}