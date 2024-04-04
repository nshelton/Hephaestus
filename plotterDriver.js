class PlotterDriver {

    constructor() {
        console.log("PlotterDriver", this)
        this.queue = []
        this.plotterPos = [0, 0]
        this.paused = false
        this.plotter = new Axidraw()
        this.optomizer = new Optomizer()
    }

    disengage () {
        this.plotter.penUp();
        this.plotter.close();
    } 
    
    penUp() { this.plotter.penUp() }
    penDown() { this.plotter.penDown() }

    saveSettings(key, value) {
        window.localStorage.setItem("plotter_" + key, value)
    }
    setPenUpValue(val) {
        if (this.plotter.connected)
            this.plotter.setPenUp(Math.round(val));
        this.saveSettings("upPosition", val)
    }
    setPenDownValue(val) {
        if (this.plotter.connected)
            this.plotter.setPenDown(Math.round(val));
        this.saveSettings("downPosition", val)
    }
    setSpeedValue(val) {
        console.log("setSpeedValue", val)
        this.plotter.speed = val;
        this.saveSettings("speed", val)
    }
    moveTo(p) {
        dx = Math.round(p[0] - plotterPos[0])
        dy = Math.round(p[1] - plotterPos[1])
        this.queue.push(["move", dx, dy])
        plotterPos = p
    }
    plot() {
        console.log("plot")
    }
    plotPath(paths) {
        console.log(paths)
        paths = this.optomizer.optomizeKD(paths)
        paths = paths.filter(p => p.length > 0)
        paths.forEach(path => {

            this.moveTo(path[0])
            this.queue.push(["down"])
            for (var i = 1; i < path.length; i++) {
                this.moveTo(path[i])
            }
            this.queue.push(["up"])
        })

        this.moveTo([0, 0])
        this.plotter.startTime = new Date()

        console.log(this.queue)
    }

    pause() { this.paused = true }
    resume() { this.paused = false }

    async readStatus() {
        if (this.plotter.commandsSent - this.plotter.commandsCompleted < 500) {
            await this.plotter.readResult()
        }
        requestAnimationFrame(this.readStatus.bind(this))
    }

    async consumeQueue() {

        if (this.paused)
            return;

        if (this.plotter.commandsSent - this.plotter.commandsCompleted >= 100)
            return;

        for (var i = 0; i < 100; i++) {
            if (this.queue.length > 0) {
                var next = this.queue.shift()
                if (next) {
                    customGui.update(this.queue, this.plotter);
                    switch (next[0]) {
                        case "move": await this.plotter.move(next[1], next[2]); break;
                        case "up": await this.plotter.penUp(); break;
                        case "down": await this.plotter.penDown(); break;
                        case "query": await this.plotter.query(); break;
                    }
                }
            }
        }

        requestAnimationFrame(this.consumeQueue.bind(this))
    }

}