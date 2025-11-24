export const successedSound = () => {
    const audio = new Audio("/notification_sound.mp3");
    const playSound = () => {
        audio.currentTime = 0;
        audio.play().catch((err) => console.log("Cannot play notification sound:", err));
    };
}
