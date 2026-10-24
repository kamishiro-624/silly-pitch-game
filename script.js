let audioCtx = null;
let playingTone = false;

function playTone(frequency, duration = 1) {
    if (playingTone) return;
    playingTone = true;

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(Number(frequency), audioCtx.currentTime);

    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);

    oscillator.onended = () => {
        playingTone = false;
    };
}

const hzInput = document.getElementById("hz-input");
const soundButton = document.getElementById("playSound");
const errorMsg = document.getElementById("errorMsg");

soundButton.addEventListener("click", () => {
    if (!hzInput.value || isNaN(hzInput.value)) {
        errorMsg.textContent = "Invalid input.";

        errorMsg.classList.remove("flash-error");
        void errorMsg.offsetWidth;
        errorMsg.classList.add("flash-error");

        return;
    }
    playTone(parseFloat(hzInput.value));
});
