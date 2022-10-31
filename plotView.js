function parseNodes(paths) {


    paths.forEach(path => {
        parsed = window.PathConverter.parse(path.attributes.d.value);
        console.log(parsed)
    })
}

function recurseTree(node) {

    node.childNodes.forEach(c => {
        recurseTree(c)
        processPath(c)
    })

}


function setupPlotView(doc) {

    paths = document.querySelectorAll("#svgContainer path")

    view = document.getElementById("plotViewContainer")

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    const scene = new THREE.Scene();

    parseNodes(paths)

}