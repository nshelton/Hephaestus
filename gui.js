

PlotterGUI = function() { 

    this.setPenUpValue = function(val) {
        this.upValueText.innerText = val
        app.setPenUpValue(val)
        plotter.setPenUp(Math.round(val)); 
        saveSettings("upPosition", val)
    }

    this.setPenDownValue = function(val) {
        this.downValueText.innerText = val
        app.setPenDownValue(val)

        
    }

    this.init = function (app) {
        this.app = app
        this.guiNode = document.getElementById("gui")

        function makeButton(text, x, y, onclick) {
            theButton = document.createElement("div")
            theButton.style.backgroundColor = "#bbbbbb"
            theButton.style.height = "30px"
            theButton.style.textAlign = "center"
            theButton.style.position = "absolute"
            theButton.style.left = x
            theButton.style.bottom = y
            theButton.style.border = "1px solid black"
            theButton.onclick = onclick
            theButton.innerText = text
            theButton.style.width = "100px"
            return theButton
        }   

        function makeText(text, x, y) {
            theButton = document.createElement("div")
            theButton.style.height = "30px"
            // theButton.style.textAlign = "center"
            theButton.style.position = "absolute"
            theButton.style.left = x
            theButton.style.bottom = y
            // theButton.style.border = "1px solid black"
            // theButton.onclick = app.plot
            theButton.innerText = text
            theButton.style.width = "100px"
            return theButton
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
        this.plotButton.style.height = "100px"
        this.guiNode.appendChild(this.plotButton)

        this.disengageButton = makeButton("disengage", 200, 0, app.disengage)
        this.guiNode.appendChild(this.disengageButton)

        this.penUpButton = makeButton("penUp", 200, 50, app.penUp)
        this.guiNode.appendChild(this.penUpButton)

        this.penDownButton = makeButton("penDown", 200, 100, app.penDown)
        this.guiNode.appendChild(this.penDownButton)

        this.penUpSlider = document.createElement("input")
        this.penUpSlider.type = "range"
        this.penUpSlider.style.backgroundColor = "#bbbbbb"
        this.penUpSlider.style.height = "30px"
        this.penUpSlider.style.position = "absolute"
        this.penUpSlider.style.left = "350px"
        this.penUpSlider.style.bottom = "100px"
        this.penUpSlider.min = 0
        this.penUpSlider.max = 33250
        this.penUpSlider.onchange = (e) => {this.setPenUpValue(e.target.value)}
        this.penUpSlider.style.width = "200px"
        this.guiNode.appendChild(this.penUpSlider)

        this.penDownSlider = document.createElement("input")
        this.penDownSlider.type = "range"
        this.penDownSlider.style.backgroundColor = "#bbbbbb"
        this.penDownSlider.style.height = "30px"
        this.penDownSlider.style.position = "absolute"
        this.penDownSlider.style.left = "350px"
        this.penDownSlider.style.bottom = "50px"
        this.penDownSlider.min = 0
        this.penDownSlider.max = 33250
        this.penDownSlider.onchange = (e) => {this.setPenDownValue(e.target.value)}
        this.penDownSlider.style.width = "200px"
        this.guiNode.appendChild(this.penDownSlider)

        
        this.upValueText = makeText("upValue", 400, 30)
        this.guiNode.appendChild(this.upValueText)

        this.downValueText = makeText("downValue", 400, 80)
        this.guiNode.appendChild(this.downValueText)

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


        // this.progressbar.style.width =  "60%"
        // this.queuebar.style.width = "70%"

        this.debugText.innerHTML = "queue : " + queue.length + "&#9;"
        this.debugText.innerHTML += "sent : " +  plotter.commandsSent + "&#9;"
        this.debugText.innerHTML += "complete : " +  plotter.commandsCompleted + "&#9;"
    }
}
