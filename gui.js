

PlotterGUI = function() { 

    this.loadSettings = function() {
        if (window.localStorage.getItem("plotter_upPosition") != null) {
            this.setPenUpValue(Number(window.localStorage.getItem("plotter_upPosition")))
        }
        if (window.localStorage.getItem("plotter_downPosition") != null) {
            this.setPenDownValue(Number(window.localStorage.getItem("plotter_downPosition")))
        }
        if (window.localStorage.getItem("plotter_speed") != null) {
            this.setSpeedValue(Number(window.localStorage.getItem("plotter_speed")))
        }
    }

    this.setPenUpValue = function(val) {
        this.upValueText.innerText = val
        this.penUpSlider.value = val
        this.app.setPenUpValue(val)
    }

    this.setPenDownValue = function(val) {
        this.downValueText.innerText = val
        this.penDownSlider.value = val
        this.app.setPenDownValue(val)
    }
    
    this.setSpeedValue = function(val) {
        this.speedValueText.innerText = "speed:\t" +  Math.round(val*100) / 100
        this.speedSlider.value = val
        this.app.setSpeedValue(val)
    }

    this.init = function (app) {
        this.app = app
        this.guiNode = document.getElementById("gui")

        function makeButton(text, x, y, onclick) {
            theButton = document.createElement("div")
            theButton.style.backgroundColor = "#000000"
            theButton.style.height = "30px"
            theButton.style.padding = "5px"
            theButton.style.color = "#8888ee"
            theButton.style.textAlign = "center"
            theButton.style.position = "absolute"
            theButton.style.left = x
            theButton.style.bottom = y
            theButton.style.border = "1px solid white"
            theButton.onclick = onclick
            theButton.innerText = text
            theButton.style.width = "100px"
            return theButton
        }   

        function makeText(text, x, y) {
            theText = document.createElement("div")
            theText.style.height = "30px"
            // theText.style.textAlign = "center"
            theText.style.position = "absolute"
            theText.style.left = x
            theText.style.bottom = y
            // theText.style.border = "1px solid black"
            // theText.onclick = app.plot
            theText.innerText = text
            theText.style.width = "100px"
            return theText
        }   

        this.progressbar = document.createElement("div")
        this.progressbar.style.backgroundColor = "#00ff00"
        this.progressbar.style.height = "10px"
        this.guiNode.appendChild(this.progressbar)

        this.queuebar = document.createElement("div")
        this.queuebar.style.backgroundColor = "blue"
        this.queuebar.style.height = "10px"
        this.guiNode.appendChild(this.queuebar)

        this.plotButton = makeButton("GO", 0, 0, app.plot)
        this.plotButton.style.height = "80px"
        this.guiNode.appendChild(this.plotButton)

        this.pauseButton = makeButton("pause", 0, 100, app.pause)
        this.guiNode.appendChild(this.pauseButton)

        this.disengageButton = makeButton("disengage", 200, 0, app.disengage)
        this.guiNode.appendChild(this.disengageButton)

        this.penUpButton = makeButton("penUp", 200, 50, app.penUp)
        this.guiNode.appendChild(this.penUpButton)

        this.penDownButton = makeButton("penDown", 200, 100, app.penDown)
        this.guiNode.appendChild(this.penDownButton)

        this.penUpSlider = document.createElement("input")
        this.penUpSlider.type = "range"
        this.penUpSlider.style.height = "30px"
        this.penUpSlider.style.position = "absolute"
        this.penUpSlider.style.left = "350px"
        this.penUpSlider.style.bottom = "50px"
        this.penUpSlider.min = 10000
        this.penUpSlider.max = 30000
        this.penUpSlider.onchange = (e) => {this.setPenUpValue(e.target.value)}
        this.penUpSlider.style.width = "500px"
        this.guiNode.appendChild(this.penUpSlider)

        this.upValueText = makeText("upValue", 400, 30)
        this.guiNode.appendChild(this.upValueText)

        this.penDownSlider = document.createElement("input")
        this.penDownSlider.type = "range"
        this.penDownSlider.style.height = "30px"
        this.penDownSlider.style.position = "absolute"
        this.penDownSlider.style.left = "350px"
        this.penDownSlider.style.bottom = "100px"
        this.penDownSlider.min = 10000
        this.penDownSlider.max = 30000
        this.penDownSlider.onchange = (e) => {this.setPenDownValue(e.target.value)}
        this.penDownSlider.style.width = "500px"
        this.guiNode.appendChild(this.penDownSlider)

        this.downValueText = makeText("downValue", 400, 80)
        this.guiNode.appendChild(this.downValueText)

        this.speedSlider = document.createElement("input")
        this.speedSlider.type = "range"
        this.speedSlider.style.height = "30px"
        this.speedSlider.style.position = "absolute"
        this.speedSlider.style.left = "350px"
        this.speedSlider.style.bottom = "0px"
        this.speedSlider.min = 0
        this.speedSlider.max = 10
        this.speedSlider.step = 0.1

        this.speedSlider.onchange = (e) => {this.setSpeedValue(e.target.value)}
        this.speedSlider.style.width = "200px"
        this.guiNode.appendChild(this.speedSlider)

        this.speedValueText = makeText("speed", 600, 00)
        this.guiNode.appendChild(this.speedValueText)

        this.debugText = document.createElement("div")

        this.guiNode.appendChild(this.debugText)
    }

    this.update = function (queue, plotter) {

        total = plotter.commandsSent + queue.length
        complete = plotter.commandsCompleted
        percent = Math.round(100 * complete / total)
        this.progressbar.style.width = percent + "%"

        percent = Math.round(100 * plotter.commandsSent / total)
        this.queuebar.style.width = percent + "%"
        
        this.debugText.innerHTML = "queue : " + queue.length + "&#9;"
        this.debugText.innerHTML += "sent : " +  plotter.commandsSent + "&#9;"
        this.debugText.innerHTML += "complete : " +  plotter.commandsCompleted + "&#9; | "

        if ( plotter.startTime) {
            let elapsed = Math.abs(new Date() - plotter.startTime.getTime());
            let fraction = (plotter.commandsCompleted / (queue.length + plotter.commandsSent));
            this.debugText.innerHTML += (100 * fraction).toFixed(1) + "%" + "&#9;| "
            if ( fraction > 0.001) {
                let remaining = elapsed /fraction - elapsed
            this.debugText.innerHTML += new Date(elapsed).toISOString().substring(11, 19) + " elapsed" + "&#9; | "
            this.debugText.innerHTML += new Date(remaining).toISOString().substring(11, 19) + " / " 
            this.debugText.innerHTML += new Date(elapsed /fraction).toISOString().substring(11, 19) 
            }

        }

    }
}
