let audioCtx = null;
let playingTone = false;

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function playTone(frequency, type = "sine", duration = 1) { // sine, square, sawtooth, triangle
    return new Promise((resolve) => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(Number(frequency), audioCtx.currentTime);

        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration); // duration 

        oscillator.onended = () => {
            resolve();
        };
    });
}

function convertCentDiff(freq1, freq2) {
    return 1200 * Math.log2(freq2 / freq1);
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

let correctAnswer; // index

let correctAnsFreq;
let wrongAnsFreq;

let pitchDeviation;

let pitchStatus; // flat or sharp

const types = ["sine", "square", "sawtooth", "triangle"];

async function playFourSounds() {
    const baseFrequency = 440; // randInt(20, 20000)
    const badTone = randInt(0, 3);

    correctAnswer = badTone + 1;

    for (let i = 0; i < 4; i++) {
        let freq = baseFrequency;
        correctAnsFreq = baseFrequency;

        if (i === badTone) {
            freq += randInt(-20, 20);
            pitchDeviation = freq - baseFrequency;
            wrongAnsFreq = freq;
        }
        await playTone(freq, types[randInt(0,3)]);
        await sleep(1000);
    }
}

const startGameButton = document.getElementById("startSounds");
const choiceButtons = document.getElementById("playerChoices");
const choiceButtonContainer = document.getElementById("choiceBtnContainer");

const message = document.getElementById("choiceFeedback");

let gotAnswer = false;

async function playToneIndep(freq, type = "sine", duration = 1) {
    await playTone(freq, type, duration);
}

function showChoices() {
    let i = 0;
    const buttons = choiceButtonContainer.children;

    if (pitchDeviation > 0) {
        pitchStatus = "sharp";
    } else {
        pitchStatus = "flat";
    }

    for (let button of buttons) {
        i++;
        const option = i;
        button.addEventListener("click", () => {
            if (gotAnswer) return;

            if (option === correctAnswer) {
                button.classList.add("correct");
                message.classList.add("success-message");

                message.textContent = option + " was " + pitchStatus + " by " + Math.abs(pitchDeviation) + " Hz (" + Math.round(Math.abs(convertCentDiff(correctAnsFreq, wrongAnsFreq))) + " cents).";
                gotAnswer = true;

                playToneIndep(correctAnsFreq, "sine", 3);
                playToneIndep(wrongAnsFreq, "sine", 3);
            } else {
                message.classList.add("error-message");
                button.classList.add("incorrect");

                button.style.transition = "none";
                button.style.transform = "none";
                button.disabled = true

                message.textContent = option + " was in tune.";

                playToneIndep(correctAnsFreq, "sine");
            }
        });
    }
}

startGameButton.addEventListener("click", async () => {
    startGameButton.disabled = true;
    startGameButton.style.backgroundColor = "#1c1c1c"; // disable for now
    startGameButton.textContent = "Playing sounds...";

    await playFourSounds();

    startGameButton.textContent = "Start Sounds";

    choiceButtons.style.display = "flex";
    showChoices();
});