function playTone(frequency, duration = 1) {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

const hzInput = document.getElementById("hz-input");
const soundButton = document.getElementById("playSound");

soundButton.addEventListener("click", () => {
    if (!hzInput.value || isNaN(hzInput.value)) {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = "Invalid input.";
        document.body.append(errorMsg);
        return;
    }
    playTone(hzInput.value);
})