let audioCtx = null;
let playingTone = false;

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const activeOscillators = []; // for all sounds being played

function stopAllOscillators() {
    activeOscillators.forEach(osc => {
        try {
            osc.stop();
            osc.disconnect();
        } catch (e) { }
    });
    activeOscillators.length = 0;
}
// INSTRUMENT STORAGE
const instrumentBank = {
    piano: null,
    flute: null // add more
};

async function loadInstrumentSample(name, url) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        instrumentBank[name] = await audioCtx.decodeAudioData(arrayBuffer);
        console.log(`${name} sample loaded successfully!`);
    } catch (e) {
        console.error(`Failed to load ${name} sample:`, e);
    }
}

loadInstrumentSample('piano', '/assets/audio/C4-piano.mp3');
loadInstrumentSample('flute', '/assets/audio/C4-flute.mp3');


// not for  native
function playInstrument(frequency, type = "piano", duration = 1) {
    return new Promise((resolve) => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        let soundNode;

        if (type in instrumentBank) {
            if (!instrumentBank[type]) {
                console.warn(`${type} sample not ready yet.`);
                resolve();
                return;
            }

            soundNode = audioCtx.createBufferSource();
            soundNode.buffer = instrumentBank[type];

            const baseFrequency = 261.63;
            soundNode.playbackRate.value = Number(frequency) / baseFrequency;
        } else {
            console.warn(`Unknown instrument type requested: "${type}".`);
            resolve();
            return;
        }

        soundNode.connect(audioCtx.destination);
        soundNode.start();

        activeOscillators.push(soundNode);
        soundNode.stop(audioCtx.currentTime + duration);

        soundNode.onended = () => {
            const index = activeOscillators.indexOf(soundNode);
            if (index > -1) {
                activeOscillators.splice(index, 1);
            }
            soundNode.disconnect();
            resolve();
        };
    });
}

function playTone(frequency, type = "sine", duration = 1) {
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

        activeOscillators.push(oscillator);

        oscillator.stop(audioCtx.currentTime + duration); // duration 

        oscillator.onended = () => {
            const index = activeOscillators.indexOf(oscillator);
            if (index > -1) {
                activeOscillators.splice(index, 1);
            }

            oscillator.disconnect();
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

const soundTypes = ["sine", "square", "sawtooth", "triangle", "piano", "flute"];

function getCheckedTypes() {
    return soundTypes.filter(type => {
        const checkbox = document.getElementById(type);
        return checkbox ? checkbox.checked : false;
    });
}

const customPitchDev = document.getElementById("customPitchDev");
const customStartNoteInput = document.getElementById("customStartNote");

async function playFourSounds() {
    let checkedTypes = getCheckedTypes();
    const badTone = randInt(0, 3);

    let customPitchDeviation = Math.abs(parseFloat(customPitchDev.value)) || 20;
    let customStartNote = parseInt(customStartNoteInput.value) || 440;

    correctAnswer = badTone + 1;

    for (let i = 0; i < 4; i++) {
        let freq = customStartNote;
        correctAnsFreq = customStartNote;

        if (i === badTone) {
            let change = randInt(-customPitchDeviation, customPitchDeviation);

            while (change === 0) {
                change = randInt(-customPitchDeviation, customPitchDeviation);
            }

            freq += change

            pitchDeviation = freq - customStartNote;
            wrongAnsFreq = freq;
        }

        let type = checkedTypes[randInt(0, checkedTypes.length - 1)] || "sine";

        const nativeTypes = ["sine", "square", "sawtooth", "triangle"];

        if (nativeTypes.includes(type)) {
            await playTone(freq, type);
            await sleep(1000);
        } else {
            await playInstrument(freq, type, 1);
            await sleep(1000);
        }
    }
}

const startGameButton = document.getElementById("startSounds");
const choiceButtons = document.getElementById("playerChoices");
const choiceButtonContainer = document.getElementById("choiceBtnContainer");

const message = document.getElementById("choiceFeedback");
const buttons = choiceButtonContainer.children;

let gotAnswer = false;

async function playToneIndep(freq, type = "sine", duration = 1) {
    await playTone(freq, type, duration);
}

async function showChoices() {
    console.log("showing choices");
    return new Promise((resolve) => {
        let i = 0;

        if (pitchDeviation > 0) {
            pitchStatus = "sharp";
        } else {
            pitchStatus = "flat";
        }

        for (let button of buttons) {
            i++;
            const option = i;

            const freshButton = button.cloneNode(true);
            button.parentNode.replaceChild(freshButton, button); // bug fix spammy

            freshButton.addEventListener("click", () => {
                if (gotAnswer) return;

                if (option === correctAnswer) {
                    freshButton.classList.add("correct");
                    message.classList.add("success-message");

                    message.textContent = option + " was " + pitchStatus + " by " + Math.abs(pitchDeviation) + " Hz (" + Math.round(Math.abs(convertCentDiff(correctAnsFreq, wrongAnsFreq))) + " cents).";
                    gotAnswer = true;

                    playToneIndep(correctAnsFreq, "sine", 3);
                    playToneIndep(wrongAnsFreq, "sine", 3);

                    resolve();
                } else {
                    message.classList.add("error-message");
                    freshButton.classList.add("incorrect");

                    freshButton.style.transition = "none";
                    freshButton.style.transform = "none";
                    freshButton.disabled = true

                    message.textContent = option + " was in tune.";

                    playToneIndep(correctAnsFreq, "sine");
                }
            });
        }
    });
}

let replayAction = false;

startGameButton.addEventListener("click", async () => {
    gotAnswer = false;

    stopAllOscillators();

    message.classList.remove("error-message", "success-message");
    message.textContent = "";

    for (let button of buttons) {
        button.classList.remove("incorrect", "correct");
        button.disabled = false;
        button.style.transition = "";
        button.style.transform = "";
    }
    choiceButtons.style.display = "";

    startGameButton.disabled = true;
    startGameButton.style.backgroundColor = "#1c1c1c"; // disable for now
    startGameButton.textContent = "Playing sounds...";

    await playFourSounds();

    startGameButton.textContent = "Choose an option";

    choiceButtons.style.display = "flex";
    await showChoices();

    startGameButton.textContent = "⟳ Replay";
    startGameButton.style.backgroundColor = "#343434";
    startGameButton.disabled = false;
});