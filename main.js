
// import { parse } from 'svg-parser';

function ApiRequest(command, params = {}) {
    fetch('http://127.0.0.1:5000/' + command, { method: 'POST', body: JSON.stringify(params) })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
        });
}


plotter = new Axidraw()


function init() {
    var guiParams = {
        serial: function () { plotter.connect() },
        connect: function () { ApiRequest("connect") },
        plot: function () { createPlotList() },
        disconnect: function () { ApiRequest("disconnect") },
        scale: 1,
        bakeScale: function () { bakeScale() },
    };

    var gui = new dat.GUI(guiParams);

    gui.add(guiParams, 'serial')
    gui.add(guiParams, 'connect')
    gui.add(guiParams, 'plot')
    gui.add(guiParams, 'disconnect')
    gui.add(guiParams, 'scale', 0.001, 10).onChange(val => scalePlot(val))
    gui.add(guiParams, 'bakeScale')

    setupScene()

}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function dropHandler(ev) {
    console.log('File(s) dropped');
    ev.preventDefault();
    if (ev.dataTransfer.items) {
        [...ev.dataTransfer.items].forEach((item, i) => {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                file.text().then(function (response) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(response, "image/svg+xml");
                    removeAllChildNodes(document.getElementById("svgContainer"))
                    document.getElementById("svgContainer").appendChild(doc.children[0]);
                    console.log(doc)
                    setupPlotView(doc)

                });
            }
        });
    }
}

function dragOverHandler(ev) { ev.preventDefault(); }