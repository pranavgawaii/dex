import confetti from "canvas-confetti";

export const triggerConfetti = () => {
    const end = Date.now() + 2 * 1000; // 2 seconds
    const colors = ["#2563EB", "#60A5FA", "#FFFFFF"];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};
