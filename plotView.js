
function parseNodes(paths, scene) {

    const material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });

    const points = [];
    points.push(new THREE.Vector3(- 10, 0, 0));
    points.push(new THREE.Vector3(0, 10, 0));
    points.push(new THREE.Vector3(10, 0, 0));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    scene.add(line);


    paths.forEach(path => {
        parsed = window.PathConverter.parse(path.attributes.d.value);
        console.log(parsed)
    })
}

const a3Width = 297
const a3Height = 420

var scene = null;

function setupScene() {
    view = document.getElementById("plotViewContainer")


    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("plotViewContainer").appendChild(renderer.domElement);

    
    const camera = new THREE.OrthographicCamera(0, 1000, 0, 1000, 1, 10000);
    camera.lookAt(new THREE.Vector3());
    const controls = new THREE.TrackballControls(camera, renderer.domElement);
    
    scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(a3Width, a3Height, a3Width/10, a3Height/10);
    // geometry.scale = new THREE.Vector3(a3Width, 1, a3Height);
    const material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffff00, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    render()
    function render() {
        renderer.render(scene, camera);
        controls.update()
        requestAnimationFrame(render)
    }
}


function setupPlotView(doc) {

    paths = document.querySelectorAll("#svgContainer path")

    parseNodes(paths, scene)


}