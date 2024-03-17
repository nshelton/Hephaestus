
plotter = new Axidraw()
viewer = new PlotViewer()
pathUtils = new PathUtils()
customGui = new PlotterGUI()
optomizer = new Optomizer()
imageUtils = new imageUtils()

var queue = []
plotterPos = [0, 0]
paused = false


currentPlotObjects = []

function createPlot(paths) {
    currentPlotObjects.push(paths)
    viewer.CreatePaths(paths)
}

function plotCurrent() {
    plotPath(viewer.createPlotList())
}

function moveTo(p) {
    dx = Math.round(p[0] - plotterPos[0])
    dy = Math.round(p[1] - plotterPos[1])
    queue.push(["move", dx, dy])
    plotterPos = p
}

async function plotPath(paths) {

    console.log(paths)
    paths = optomizer.optomizeKD(paths)

    paths = paths.filter(p => p.length > 0)
    paths.forEach(path => {

        moveTo(path[0])
        queue.push(["down"])
        for (var i = 1; i < path.length; i++) {
            moveTo(path[i])
        }
        queue.push(["up"])
    })

    moveTo([0, 0])
    plotter.startTime = new Date()

    console.log(queue)
}

function pause() { paused = true }
function resume() { paused = false }

async function readStatus() {
    if (plotter.commandsSent - plotter.commandsCompleted < 500) {
        await plotter.readResult()
        customGui.update(queue, plotter);
    }
    requestAnimationFrame(readStatus)
}

async function consumeQueue() {

    if (paused) 
    return;

    if (plotter.commandsSent - plotter.commandsCompleted >= 100) 
    return;

    console.log("update", queue.length, plotter.commandsSent, plotter.commandsCompleted)

    for (var i = 0; i < 100; i++) {
        if (queue.length > 0) {
            var next = queue.shift()
            if (next) {
                customGui.update(queue, plotter);
                switch (next[0]) {
                    case "move": await plotter.move(next[1], next[2]); break;
                    case "up": await plotter.penUp(); break;
                    case "down": await plotter.penDown(); break;
                    case "query": await plotter.query(); break;
                }
            }
        }
    }

    requestAnimationFrame(consumeQueue)
}

function saveSettings(key, value) {
    window.localStorage.setItem("plotter_" + key, value)
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function loadImage(file) {
  
    createImageBitmap(file).then(data => {

        const canvas = new OffscreenCanvas(data.width, data.height);
        const ctx = canvas.getContext('2d');

        console.log(data)
        ctx.drawImage(data, 0, 0, data.width, data.height);
        console.log(ctx)

        var imgd = ctx.getImageData(0, 0, data.width, data.height);
        var pix = imgd.data;

        paths = imageUtils.hatch(pix, data.width, data.height, optomizer)
        paths = paths.map(path => path.map(p => [p[1], p[0]]))
        createPlot(paths)
        // createPlot(imageUtils.dither(pix, data.width, data.height))

    })

}

function loadSVG(file) {
    file.text().then(function (response) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(response, "image/svg+xml");
        removeAllChildNodes(document.getElementById("svgContainer"))
        document.getElementById("svgContainer").appendChild(doc.children[0]);
        console.log(doc)
        viewer.setupPlotView(doc)
    });
}


async function readFileContents(file) {
    try {
      const fileContents = await file.text();
      return JSON.parse(fileContents); // Parse JSON text into an object
    } catch (error) {
      console.error(`Error reading file ${file.name}:`, error);
      return null; // Return null if there's an error reading the file
    }
}

const LoadFileEntry = async (entry) => {
    console.log(entry)
    const file = await entry.getFile();
    const contents = await readFileContents(file);
    console.log(contents)

    if (contents.paths) {
        viewer.ClearAll()
        contents.paths.forEach( path => createPlot(path))
    }

}

const printFilesInDirectory = async (element, mouseEvent) => {
    const explorer_node = document.getElementById("explorer");
    const directoryHandle = await window.showDirectoryPicker();
    for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file') {

            project_name = entry.name.split(".")[0]
            if (!entry.name.endsWith("json")) continue;
            var projectEntry = document.createElement("div")
            var projectEntryTitle = document.createElement("h1")
            var projectEntryInfo = document.createElement("span")
            projectEntry.appendChild(projectEntryTitle)
            projectEntry.appendChild(projectEntryInfo)

            projectEntry.classList.add('explorerEntry')
            projectEntryTitle.innerText = project_name

            const file = await entry.getFile();
            const contents = await readFileContents(file);
            console.log(contents)
            console.log(contents.timestamp)
            time = contents.timestamp | "Notime"
            console.log(time)
            projectEntryInfo.innerHTML = contents.timestamp + "<br>"
            projectEntryInfo.innerHTML += "<ul>"
            contents.paths.forEach( p => {
                total = p.reduce((acc, current) =>  current.length + acc, 0)
                projectEntryInfo.innerHTML += "<li>" + total + " verts " + p.length + " lines </li><br>"
            })

            projectEntryInfo.innerHTML += "</ul>"
            
            explorer_node.appendChild(projectEntry)

            projectEntry.addEventListener("click", function(e){
                LoadFileEntry(entry)
            })
        }
    }
  
    document.removeEventListener("click", printFilesInDirectory);// Add onclick eventListener 
};

function dropHandler(ev) {
    console.log('File(s) dropped');
    ev.preventDefault();
    if (ev.dataTransfer.items) {
        [...ev.dataTransfer.items].forEach((item, i) => {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file.name.endsWith(".svg")) {
                    loadSVG(file)
                } else {
                    loadImage(file)
                }
            }
        });
    }
}

function dragOverHandler(ev) { ev.preventDefault(); }

function saveCurrentToDB() {
    const date = new Date()
    date_time_string = date.toLocaleDateString() + " " + date.toLocaleTimeString()
    
    data_to_save = {
        "paths" : currentPlotObjects,
        "timestamp" : date_time_string,
        "thumbnail"  : []
    }

    var fileContent = JSON.stringify(data_to_save, function(key, val) {
        return val.toFixed ? Number(val.toFixed(3)) : val;
    })
    
    var bb = new Blob([fileContent ], { type: 'text/plain' });
    var a = document.createElement('a');
    a.download = 'download.json';
    a.href = window.URL.createObjectURL(bb);
    a.click();
}

function setupDragExplorer() {
    const explorer_node = document.getElementById("explorer");
    const gui_node = document.getElementById("gui");

    const BORDER_SIZE = 20;
    let m_pos;
    function resize(e){
        explorer_node.style.width = e.x + "px";
        gui_node.style.left = e.x + "px";
    }

    explorer_node.addEventListener("mousedown", function(e){
        currentWidth = parseInt(getComputedStyle(explorer_node, '').width) 
        if (Math.abs(e.offsetX - currentWidth) < BORDER_SIZE) {
            document.addEventListener("mousemove", resize, false);
        }
    }, false);

    document.addEventListener("mouseup", function(){
        document.removeEventListener("mousemove", resize, false);
    }, false);
}

function init() {
    setupDragExplorer()
    document.addEventListener("click", printFilesInDirectory , false);// Add onclick eventListener 

    var guiParams = {

        grid: function () { createPlot(pathUtils.gridTest()) },
        rect: function () { createPlot([pathUtils.rectPath(100, 100, 1000, 1000)]) },
        circleGrid: function () { createPlot(pathUtils.circleGrid()) },
        dragon: function () { createPlot(pathUtils.dragonPath()) },
        circle: function () { createPlot([pathUtils.circlePath(2000, 2000, 4000, 5)]) },
        flowField: function () { createPlot(pathUtils.flowField()) },
        apollo: function () { createPlot(pathUtils.apollonian()) },
        mandala: function () { createPlot(pathUtils.mandala()) },
        sierpinski: function () { createPlot(pathUtils.sierpinski()) },
        voronoi: function () { createPlot(pathUtils.voronoi()) },
        timestamp: function () { createPlot(pathUtils.timestamp()) },
        darkmode: function () { viewer.toggleColors() },
        saveCurrentToDB : function() {saveCurrentToDB()}
    };

    //load Settings

    var gui = new dat.GUI(guiParams);

    gui.add(guiParams, 'rect')
    gui.add(guiParams, 'grid')
    gui.add(guiParams, 'dragon')
    gui.add(guiParams, 'flowField')
    gui.add(guiParams, 'circleGrid')
    gui.add(guiParams, 'circle')
    gui.add(guiParams, 'apollo')
    gui.add(guiParams, 'mandala')
    gui.add(guiParams, 'sierpinski')
    gui.add(guiParams, 'voronoi')
    gui.add(guiParams, 'darkmode')
    gui.add(guiParams, 'saveCurrentToDB')

    app = {
        plot: plotCurrent,
        disengage: function () {
            plotter.penUp();
            plotter.close();
        },
        penUp: function () { plotter.penUp() },
        penDown: function () { plotter.penDown() },
        pause: function () { paused = !paused },

        setPenUpValue: function (val) {
            if (plotter.connected)
                plotter.setPenUp(Math.round(val));
            saveSettings("upPosition", val)
        },
        setPenDownValue: function (val) {
            if (plotter.connected)
                plotter.setPenDown(Math.round(val));
            saveSettings("downPosition", val)
        },
        setSpeedValue: function (val) {
            console.log("setSpeedValue", val)
            plotter.speed = val;
            saveSettings("speed", val)
        }
    }

    viewer.setupScene()
    customGui.init(app);

    consumeQueue()
    readStatus()
    // plotter.connect()

    setTimeout(() => {
        if (window.localStorage.getItem("plotter_upPosition") != null) {
            customGui.setPenUpValue(Number(window.localStorage.getItem("plotter_upPosition")))
        }
        if (window.localStorage.getItem("plotter_downPosition") != null) {
            customGui.setPenDownValue(Number(window.localStorage.getItem("plotter_downPosition")))
        }
        if (window.localStorage.getItem("plotter_speed") != null) {
            customGui.setSpeedValue(Number(window.localStorage.getItem("plotter_speed")))
        }

        textstring = new Date().toLocaleString().split(",")[0]
        textstring = textstring.replace("2023", "23")
        textstring += " "
        textstring += + new Date()
        var textPath = pathUtils.text(textstring + "")
        textPath.flat(2)
        var textPath = pathUtils.transform(textPath, 0.006, 50, 10)
        createPlot(textPath)
         textPath.flat(2)
        var textPath = pathUtils.transform(textPath, 0.01, 50, 10)
        // createPlot(textPath)

        var squares = []

        for (var x = 0; x < 3; x ++) {
            for (var y = 0; y < 3; y ++) {
                squares.push(pathUtils.rectPath( 50 + x*30, 50 + y*30, 25, 25))
            }
        }

        // console.log(textPath)
        // console.log(squares)



        // createPlot(imageUtils.star())
        // image = imageUtils.createImage()
        // createPlot(imageUtils.dither(image.data, image.width, image.height))
  

        // paths = viewer.createPlotList()
        // console.log(paths)
        // paths1 = optomizer.optomizeKD(paths)
        // // paths1 = optomizer.optomizeGrid(paths)

        // viewer.drawPlotterMovements(paths1)

    }, "100")


    // setTimeout(() => {
    //     // viewer.AddPath(pathUtils.circlePath(3000, 3000, 4000, 100))
    //     createPlot(pathUtils.flowField())

    //     // list = viewer.createPlotList()
    //     // console.log(list)

    // }, "1000")
}