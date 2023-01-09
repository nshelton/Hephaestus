

PlotterGUI = function() { 


    this.init = function (app) {

        this.guiNode = document.getElementById("gui")
        
        this.progressbar = document.createElement("div")
        this.progressbar.style.backgroundColor = "#00ff00"
        this.progressbar.style.height = "10px"
        this.guiNode.appendChild(this.progressbar)

        this.queuebar = document.createElement("div")
        this.queuebar.style.backgroundColor = "blue"
        this.queuebar.style.height = "10px"
        this.guiNode.appendChild(this.queuebar)

        this.plotButton = document.createElement("div")
        this.plotButton.style.backgroundColor = "#bbbbbb"
        this.plotButton.style.height = "50px"
        this.plotButton.style.textAlign = "center"
        this.plotButton.style.position = "absolute"
        this.plotButton.style.left = "0"
        this.plotButton.style.bottom = "0"
        this.plotButton.style.border = "1px solid black"
        this.plotButton.onclick = app.plot
        this.plotButton.innerText = "GO"
        this.plotButton.style.width = "100px"
        this.guiNode.appendChild(this.plotButton)

        this.disengageButton = document.createElement("div")
        this.disengageButton.style.backgroundColor = "#bbbbbb"
        this.disengageButton.style.height = "30px"
        this.disengageButton.style.textAlign = "center"
        this.disengageButton.style.position = "absolute"
        this.disengageButton.style.right = "0"
        this.disengageButton.style.bottom = "0"
        this.disengageButton.onclick = app.disengage
        this.disengageButton.innerText = "disengage"
        this.disengageButton.style.width = "100px"
        this.disengageButton.style.border = "1px solid black"
        this.guiNode.appendChild(this.disengageButton)

        this.penUp = document.createElement("div")
        this.penUp.style.backgroundColor = "#bbbbbb"
        this.penUp.style.height = "30px"
        this.penUp.style.textAlign = "center"
        this.penUp.style.position = "absolute"
        this.penUp.style.right = "0"
        this.penUp.style.bottom = "60px"
        this.penUp.onclick = app.penUp
        this.penUp.innerText = "up"
        this.penUp.style.border = "1px solid black"
        this.penUp.style.width = "100px"
        this.guiNode.appendChild(this.penUp)
        
        this.penUpValue = document.createElement("input")
        this.penUpValue.type = "range"
        this.penUpValue.style.backgroundColor = "#bbbbbb"
        this.penUpValue.style.height = "30px"
        this.penUpValue.style.position = "absolute"
        this.penUpValue.style.right = "200px"
        this.penUpValue.style.bottom = "60px"
        this.penUpValue.onclick = app.penUpValue
        this.penUpValue.style.border = "1px solid black"
        this.penUpValue.style.width = "200px"
        this.guiNode.appendChild(this.penUpValue)

        this.penDown = document.createElement("div")
        this.penDown.style.backgroundColor = "#bbbbbb"
        this.penDown.style.height = "30px"
        this.penDown.style.textAlign = "center"
        this.penDown.style.position = "absolute"
        this.penDown.style.right = "0"
        this.penDown.style.bottom = "90px"
        this.penDown.onclick = app.penDown
        this.penDown.style.border = "1px solid black"
        this.penDown.innerText = "down"
        this.penDown.style.width = "100px"
        this.guiNode.appendChild(this.penDown)
        


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
