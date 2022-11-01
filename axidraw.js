
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
        this.port = await navigator.serial.requestPort();
        await this.port.open({ baudRate: 9600 });
        this.writer = this.port.writable.getWriter();
        this.reader = this.port.readable.getReader();

        this.disableMotor()
        // await this.penUp()
        // await this.move(1000,10,10)
        // await this.move(1000,100,100)
        // await this.move(1000,1000,1000)
        // await this.close()

    }

    this.penUp = async function () { await this.writeCommand("SP,1") }
    this.penDown = async function () { await this.writeCommand("SP,0") }

    this.move = async function (x, y) { await this.writeCommand(`XM,${Math.floor(this.speed * Math.sqrt(x*x+y*y))},${x},${y}`) }
    this.disableMotor = async function () { await this.writeCommand("EM,0,0") }
    this.enableMotor = async function () { await this.writeCommand(`EM,${this.stepmode},1`) }

    this.writeCommand = async function (command) {
        console.log(command)
        await this.writer.write(this.textEncoder.encode(command + "\r"));
        await this.readResult()
    }

    this.close = async function () {
        await this.readResult()
        await this.writer.releaseLock();
        await this.port.close();
    }

    this.readResult = async function () {

        while (true) {
            const { value, done } = await this.reader.read();
            if (done) {
                this.reader.releaseLock();
                break;
            }

            console.log(this.textDecoder.decode(value));
        }
    }



};