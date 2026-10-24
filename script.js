let audioCtx = null;
let playingTone = false;

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function playTone(frequency, duration = 1) {
    return new Promise((resolve) => {
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
            resolve();
        };
    });
}

const hzInput = document.getElementById("hz-input");
const soundButton = document.getElementById("playSound");
const errorMsg = document.getElementById("errorMsg");

soundButton.addEventListener("click", async () => {
    if (!hzInput.value || isNaN(hzInput.value)) {
        errorMsg.textContent = "Invalid input.";

        errorMsg.classList.remove("flash-error");
        void errorMsg.offsetWidth;
        errorMsg.classList.add("flash-error");

        return;
    }
    await playTone(parseFloat(hzInput.value));
});

// GAME FUNCTIONS

let correctAnswer;
let pitchDeviation;

async function playFourSounds() {
    const baseFrequency = 440;
    const badTone = randInt(0, 3);

    correctAnswer = badTone + 1;

    for (let i = 0; i < 4; i++) {
        let freq = baseFrequency;
        if (i === badTone) {
            freq += randInt(-20, 20);
            pitchDeviation = freq - baseFrequency;
        }
        await playTone(freq);
        await sleep(1);
    }
}

const startGameButton = document.getElementById("startSounds");
const choiceButtons = document.getElementById("playerChoices");
const choiceButtonContainer = document.getElementById("choiceBtnContainer");

const message = document.getElementById("choiceFeedback");

let gotAnswer = false;

function showChoices() {
    let i = 0;
    const buttons = choiceButtonContainer.children;

    for (let button of buttons) {
        i++;
        const option = i;
        button.addEventListener("click", () => {
            if (gotAnswer) return;

            if (option === correctAnswer) {
                button.classList.add("correct");
                message.classList.add("success-message");

                message.textContent = option + " was off by " + pitchDeviation + "Hz.";
                gotAnswer = true;
            } else {
                message.classList.add("error-message");
                button.classList.add("incorrect");

                button.style.transition = "none";
                button.style.transform = "none";
                button.disabled = true

                message.textContent = option + " was in tune.";
            }
        });
    }
}

startGameButton.addEventListener("click", async () => {
    startGameButton.disabled = true;
    startGameButton.textContent = "Playing sounds...";

    await playFourSounds();

    startGameButton.textContent = "Start Sounds";
    startGameButton.disabled = false;

    choiceButtons.style.display = "flex";
    showChoices();
});