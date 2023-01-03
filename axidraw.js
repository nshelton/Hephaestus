
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
    this.speed = 4
    this.connected = false;

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
        this.connected = true
    }

    this.penUp = async function (duration = 10) { return await this.writeCommand(`SP,1,${duration}`), this.writeCommand("XM,50,0,0") }
    this.penDown = async function (duration = 10) { return await this.writeCommand(`SP,0,${duration}`), this.writeCommand("XM,50,0,0") }
    this.move = async function (x, y) { return await this.writeCommand(`XM,${Math.floor(Math.sqrt(x * x + y * y) / this.speed)},${x},${y}`) }
    this.disableMotor = async function () { return await this.writeCommand("EM,0,0") }
    this.enableMotor = async function () { return await this.writeCommand(`EM,${this.stepmode},1`) }
    this.stop = async function () { return await this.writeCommand(`R`) }

    this.setPenUp = async function (val) { return await this.writeCommand(`SC,4,${val}`) }
    this.setPenDown = async function (val) { return await this.writeCommand(`SC,5,${val}`) }



    this.commandsSent = 0
    this.commandsCompleted = 0

    this.writeCommand = async function (command) {
        // if (!this.connected) { await this.connect(); }

        console.log(command)
        this.commandsSent++;
        await this.writer.write(this.textEncoder.encode(command + "\r"));
        return await this.readResult()
    }

    this.close = async function () {
        await this.penUp()
        await this.disableMotor()
        await this.readResult()
        await this.writer.releaseLock();
        await this.port.close();
        this.connected = false
    }

    this.readResult = async function () {
        response = ""
        if (!this.reader)
            return ""

        while (true) {
            const { value, done } = await this.reader.read();
            response += this.textDecoder.decode(value);

            if (response.endsWith("\r\n")) {
                // console.log(value, response, done)
                break;
            }

            if (done) {
                console.log("RELEASE LOCK????")
                // this.reader.releaseLock();
                break;
            }
        }

        var count = (response.match(/OK/g) || []).length;
        this.commandsCompleted += count

        console.log(count, "response \t " + response)
        return response
    }

};