import "./style.css";
// パッチインポート
import { createDevice, MessageEvent , MIDIEvent, TimeNow } from "@rnbo/js";
const patchExportURL = "./rnbo/patch.export.json";
// Create AudioContext
const WAContext = window.AudioContext || window.webkitAudioContext;
const context = new WAContext();

async function setup() {
    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);

    // Fetch the exported patcher
    let response, patcher;
    try {
        response = await fetch(patchExportURL);
        patcher = await response.json();

    } catch (err) {
        const errorContext = {
            error: err
        };
        if (response && (response.status >= 300 || response.status < 200)) {
            errorContext.header = `Couldn't load patcher export bundle`,
                errorContext.description = `Check app.js to see what file it's trying to load. Currently it's` +
                    ` trying to load "${patchExportURL}". If that doesn't` +
                    ` match the name of the file you exported from RNBO, modify` +
                    ` patchExportURL in app.js.`;
        }
        if (typeof guardrails === "function") {
            guardrails(errorContext);
        } else {
            throw err;
        }
        return;
    }
    let device;
    try {
        device = await createDevice({ context, patcher });
    } catch (err) {
        if (typeof guardrails === "function") {
            guardrails({ error: err });
        } else {
            throw err;
        }
        return;
    }

    // Load our sample as an ArrayBuffer;
    const fileResponse = await fetch("./rnbo/media/018.wav");
    const arrayBuf = await fileResponse.arrayBuffer();
    // Decode the received Data as an AudioBuffer
    const audioBuf = await context.decodeAudioData(arrayBuf);
    console.log(audioBuf)
    // Set the DataBuffer on the device
    await device.setDataBuffer("sample01", audioBuf);
    // Connect the device to the web audio graph
    device.node.connect(outputNode);

    receiveMidiCC(device)

    device.messageEvent.subscribe((ev) => {
        displayValueFromRNBO(ev.tag, ev.payload)
        const rects = document.querySelectorAll('.rect')
        if(ev.tag === 'position') {
            rects.forEach((rect) =>{
                rect.style.transform = `rotate(${ev.payload / 25 * -1}deg)`
            })
        }

    });
}
document.querySelector('body').addEventListener('click', function() {
    context.resume().then(() => {
        console.log('Playback resumed successfully');
    });
});

let values = {
    start: 0,
    end: 0,
    position: 0,
    speed: 0
};

const displayValueFromRNBO = (target, value) => {
    values[target] = value
    const changeTarget = document.querySelector(`*[data-type="${target}"]`)
    if(target === 'speed') {
    changeTarget.innerText = Math.floor( values.speed[0] * Math.pow( 10, 2 ) ) / Math.pow( 10, 2 ) ;


    }
    else if(changeTarget)
    changeTarget.innerText = msToTime(value);

    if(target === 'end') {
        console.log(values)
        const length = document.querySelector(`*[data-type="length"]`)
        length.innerText = values.end - values.start;
    }
}

function msToTime(duration) {
    const hour = Math.floor(duration / 3600000);
    const minute = Math.floor((duration - 3600000 * hour) / 60000);

    const mm = ('00' + minute).slice(-2);
    const ms = ('00000' + (duration % 60000)).slice(-5);

    return `${mm}:${ms.slice(0,2)}.${ms.slice(2,4)}`;
}
const receiveMidiCC = (device) => {
    navigator.requestMIDIAccess().then((midiAccess) => {
        midiAccess.inputs.forEach((input) => {
            // printString(input.name)
            input.onmidimessage = function (msg) {
                const message = [msg.data[0] , msg.data[1] , msg.data[2]]
                const event = new MIDIEvent(TimeNow, 0, message);
                device.scheduleEvent(event);
            };
        })
    });
}

setup()
