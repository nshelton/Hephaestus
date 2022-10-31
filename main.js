
// import { parse } from 'svg-parser';

function ApiRequest(command) {
    fetch('http://127.0.0.1:5000/' + command, { method: 'POST' })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
        });
}

function init() {
    var guiParams = {
        connect: function () { ApiRequest("connect") },
        plot: function () { ApiRequest("plot") },
        disconnect: function () { ApiRequest("disconnect") },
    };

    var gui = new dat.GUI(guiParams);

    gui.add(guiParams, 'connect')
    gui.add(guiParams, 'plot')
    gui.add(guiParams, 'disconnect')

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