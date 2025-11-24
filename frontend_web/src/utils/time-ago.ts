export const formatTimeAgo = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "";

    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);

    if (sec < 10) return "Vừa xong";
    if (sec < 60) return `${sec} giây trước`;
    if (min < 60) return `${min} phút trước`;
    if (hour < 24) return `${hour} giờ trước`;
    if (day === 1) return "Hôm qua";
    if (day < 7) return `${day} ngày trước`;

    const week = Math.floor(day / 7);
    if (week < 4) return `${week} tuần trước`;

    return date.toLocaleDateString("vi-VN");
};
