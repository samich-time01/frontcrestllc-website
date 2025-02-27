const createOfflineTts = window.createOfflineTts;

let ttsEngine = null;
let audioContext = null;
let isTtsEngineReady = false;

Module = {};
Module.onRuntimeInitialized = function() {
  console.log('Sherpa-ONNX WASM runtime initialized - onRuntimeInitialized START in sherpa_interop.js'); // START log

  try {
    const offlineTtsConfig = {
      offlineTtsModelConfig: {
        offlineTtsVitsModelConfig: {
          model: '../sherpa-onnx/build-wasm-simd-tts/install/bin/wasm/tts/model.onnx',
          tokens: '../sherpa-onnx/build-wasm-simd-tts/install/bin/wasm/tts/tokens.txt',
          dataDir: '../sherpa-onnx/build-wasm-simd-tts/install/bin/wasm/tts/espeak-ng-data',
          lexicon: '',
          noiseScale: 0.667,
          noiseScaleW: 0.8,
          lengthScale: 1.0,
          dictDir: '',
        },
        numThreads: 1,
        debug: 1,
        provider: 'cpu',
      },
      ruleFsts: '',
      ruleFars: '',
      maxNumSentences: 1,
    };

    console.log('Creating TTS Engine...'); // Log before createOfflineTts
    ttsEngine = createOfflineTts(Module, offlineTtsConfig);
    console.log('TTS Engine Creation Attempted.'); // Log after createOfflineTts

    if (ttsEngine) {
      console.log('Sherpa-ONNX TTS engine created SUCCESSFULLY in sherpa_interop.js');
      console.log(`Number of speakers: ${ttsEngine.numSpeakers}`);
      isTtsEngineReady = true;
      console.log('TTS Engine Ready: ', isTtsEngineReady);
    } else {
      console.error('Failed to create Sherpa-ONNX TTS engine - ttsEngine is NULL in sherpa_interop.js');
      isTtsEngineReady = false;
      console.log('TTS Engine Ready: ', isTtsEngineReady);
    }
  } catch (error) {
    console.error('Error during TTS engine initialization - EXCEPTION:', error); // Log full error
    isTtsEngineReady = false;
    console.log('TTS Engine Ready (after error): ', isTtsEngineReady);
  }
  console.log('Sherpa-ONNX WASM runtime initialized - onRuntimeInitialized END in sherpa_interop.js'); // END log
};

window.isTtsEngineReady = () => isTtsEngineReady;


function callSherpaTTS(speakerId, speed, text) {
  console.log("callSherpaTTS in sherpa_interop.js - Received from Dart:");
  console.log("Speaker ID:", speakerId, typeof speakerId);
  console.log("Speed:", speed, typeof speed);
  console.log("Text:", text, typeof text);

  if (!isTtsEngineReady) {
    console.error('TTS Engine not initialized yet! - callSherpaTTS aborted');
    return;
  }

  if (!ttsEngine) {
    console.error('TTS Engine is unexpectedly null!');
    return;
  }


  if (!audioContext) {
    audioContext = new AudioContext({sampleRate: ttsEngine.sampleRate});
  }


  try {
    const audio = ttsEngine.generate({
      text: text,
      sid: parseInt(speakerId, 10),
      speed: parseFloat(speed)
    });

    console.log('TTS Audio generated:', audio.samples.length, audio.sampleRate);

    const buffer = audioContext.createBuffer(1, audio.samples.length, ttsEngine.sampleRate);
    const ptr = buffer.getChannelData(0);
    for (let i = 0; i < audio.samples.length; i++) {
      ptr[i] = audio.samples[i];
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();


  } catch (error) {
    console.error('Error during TTS generation:', error);
  }
}