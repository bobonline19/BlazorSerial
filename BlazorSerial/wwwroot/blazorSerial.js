var blazorSerialPort;
var blazorSerialTextEncoder = new TextEncoder();

let reader;
let inputDone;
let outputDone;


function blazorSerialIsSupported() {
    return navigator.serial ? true : false;
}

async function blazorSerialGetPort() {
    try {
        blazorSerialPort = await navigator.serial.requestPort();
        return "Ok";
    }
    catch (ex) {
        if (ex instanceof SecurityError) {
            return "SecurityError";
        }
        else if (ex instanceof AbortError) {
            return "AbortError";
        }
        else {
            return "Unknown";
        }
    }
}

async function blazorSerialOpen(baudRate) {
    try {
        await blazorSerialPort.open({ baudRate: baudRate });

        let decoder = new TextDecoderStream();
        inputDone = port.readable.pipeTo(decoder.writable);
        inputStream = decoder.readable
        .pipeThrough(new TransformStream(new LineBreakTransformer()));
    
      reader = inputStream.getReader();

        return "Ok";
    }
    catch (ex) {
        if (ex instanceof InvalidStateError) {
            return "InvalidStateError";
        }
        else if (ex instanceof NetworkError) {
            return "NetworkError";
        }
        else {
            return "Unknown";
        }
    }
}

function blazorSerialWriteText(text) {
    let writer = blazorSerialPort.writable.getWriter();
    writer.write(blazorSerialTextEncoder.encode(text));
    writer.releaseLock();
}

async function blazorSerialReadLineAsync() {
    const { value, done } = await reader.read();
    if (value) {
        return value;    
    }
    if (done) {
      console.log('[readLoop] DONE', done);
      reader.releaseLock();
      return null;
    }
}

async function blazorSerialClose() {
    if (reader) {
        await reader.cancel();
        await inputDone.catch(() => {});
        reader = null;
        inputDone = null;
      }

    blazorSerialPort.close();
}

/**
 * @name LineBreakTransformer
 * TransformStream to parse the stream into lines.
 */
class LineBreakTransformer {
  constructor() {
    // A container for holding stream data until a new line.
    this.container = '';
  }

  transform(chunk, controller) {
    // CODELAB: Handle incoming chunk
this.container += chunk;
const lines = this.container.split('\r\n');
this.container = lines.pop();
lines.forEach(line => controller.enqueue(line));
  }

  flush(controller) {
    // CODELAB: Flush the stream.
controller.enqueue(this.container);
  }
}