
Axidraw = function () {

    var _this = this;

    this.port = null
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder()
    this.writableStreamClosed = null
    this.writer = null
    this.reader = null

    // 1: step mode to 1/16 step mode (default step mode upon reset)
    // 2: step mode to 1/8 step mode
    // 3: step mode to 1/4 step mode
    // 4: step mode to 1/2 step mode
    // 5: step mode to full step mode
    this.stepmode = 1
    this.speed = 1


    this.connect = async function () {
        const ports = await navigator.serial.getPorts();
        console.log(ports)

        if (ports.length == 0) {
            this.port = await navigator.serial.requestPort();
        } else {
            this.port = ports[0]
        }

        await this.port.open({ baudRate: 9600 });
        this.writer = this.port.writable.getWriter();
        this.reader = this.port.readable.getReader();
    }

    this.penUp = async function () { await this.writeCommand("SP,1") }
    this.penDown = async function () { await this.writeCommand("SP,0") }
    this.move = async function (x, y) { await this.writeCommand(`XM,${Math.floor(Math.sqrt(x * x + y * y) / this.speed)},${x},${y}`) }
    this.disableMotor = async function () { await this.writeCommand("EM,0,0") }
    this.enableMotor = async function () { await this.writeCommand(`EM,${this.stepmode},1`) }
    this.stop = async function () { await this.writeCommand(`ES`) }

    this.setPenUp = async function (val) { await this.writeCommand(`SC,4,${val}`) }
    this.setPenDown = async function (val) { await this.writeCommand(`SC,5,${val}`) }


    this.writeCommand = async function (command) {
        console.log(command)
        await this.writer.write(this.textEncoder.encode(command + "\r"));
        await this.readResult()
    }

    this.close = async function () {
        await this.disableMotor()
        await this.readResult()
        await this.writer.releaseLock();
        await this.port.close();
    }

    this.readResult = async function () {
        response = ""
        while (true) {
            const { value, done } = await this.reader.read();
            response += this.textDecoder.decode(value);
            if (response.endsWith("\r\n")) {
                // console.log(value, response, done)
                break;
            }

            if (done ) {
                console.log("RELEASE LOCK????")
                // this.reader.releaseLock();
                break;
            }
        }

        console.log("response \t " + response)
    }

};