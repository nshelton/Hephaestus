var segments = []
var lineObjects = []

var boundingBox = null
var container = null
var scaleWidget = null

var renderer, camera, controls
var scene = null;

function parseNodes(paths, scene) {

    console.log(paths)

    const material = new THREE.LineBasicMaterial({
        color: 0xff0000
    });

    paths.forEach(path => {
        parsed = window.PathConverter.parse(path.attributes.d.value);

        console.log(parsed)
        if (parsed.current != null) {
            var segment = parsed.current.points.map(p => [p.main.x, p.main.y])
            segments.push(segment)
        }

        parsed.curveshapes.forEach(c => {
            if (c && c.points != null) {
                curve = c.points.map(p => [p.main.x, p.main.y])
                segments.push(curve)
            }
        })
    })

    container = new THREE.Object3D()
    segments.forEach(segment => {
        const points = segment.map(s => new THREE.Vector3(s[0], s[1], 0))
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        lineObjects.push(line)
        container.add(line);
    })

    scene.add(container)

    var bbox = new THREE.Box3().setFromObject(container);

    const bbgeometry = new THREE.BoxGeometry(1, 1, 1);
    const bbmaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    boundingBox = new THREE.Mesh(bbgeometry, bbmaterial);
    var scale = new THREE.Vector3()
    var position = new THREE.Vector3()

    bbox.getSize(scale)
    bbox.getCenter(position)
    var scaleScalar = 300 / Math.max(scale.x, scale.y)

    container.position.set(-position.x / 2 * scaleScalar, -position.y / 2 * scaleScalar, -position.z / 2 * scaleScalar)
    container.scale.set(scaleScalar, scaleScalar, scaleScalar)
    container.updateMatrix()

    console.log(container.matrix)

    container.children.forEach(obj => {
        obj.geometry.applyMatrix4(container.matrix);
    });

    container.position = new THREE.Vector3()
    container.scale.set(1, 1, 1)
    container.updateMatrix()

    var bbox = new THREE.Box3().setFromObject(container);
    // bbox.getSize(boundingBox.scale)
    boundingBox.scale.set(100, 100, 100)
    bbox.getCenter(boundingBox.position)
    boundingBox.updateMatrix()
    boundingBox.geometry.applyMatrix4(boundingBox.matrix);

    boundingBox.position = new THREE.Vector3()
    boundingBox.scale.set(1, 1, 1)
    boundingBox.updateMatrix()

    scene.add(boundingBox)

    const sphereGeo = new THREE.SphereGeometry(5, 4, 4);
    scaleWidget = new THREE.Mesh(sphereGeo, bbmaterial);
    boundingBox.add(scaleWidget)
    scaleWidget.position.set(100, 100, 0)

    controls.registerObject(scaleWidget)
    controls.registerObject(boundingBox)

}

function plotControl(command, params) {
    fetch('http://127.0.0.1:5000/' + command, { method: 'POST', body: JSON.stringify(params) })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
        });
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function sendCommands(cmdList) {
    console.log(cmdList)

    for (var i = 0; i < cmdList.length; i++) {
        cmd = cmdList[i]
        await delay(1000);
        plotControl(cmd[0], cmd[1] + "," + cmd[2])
    }
}

function createPlotList() {

    const bbgeometry = new THREE.BoxGeometry(1, 1, 1);
    const bbmaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    container.updateMatrix()

    commands = []
    lineObjects.forEach(line => {
        line.geometry.applyMatrix4(container.matrix)
        line.removeFromParent()
        scene.add(line)

        const x = line.geometry.attributes.position.array[0]
        const y = line.geometry.attributes.position.array[1]
        var debugBox = new THREE.Mesh(bbgeometry, bbmaterial);
        debugBox.position.set(Math.round(x * 100) / 100, Math.round(y * 100) / 100, 0)
        coords = []
        coords.push([x, y])

        scene.add(debugBox)
        for (var i = 3; i < line.geometry.attributes.position.count; i += 3) {
            const x = line.geometry.attributes.position.array[i * 3 + 0]
            const y = line.geometry.attributes.position.array[i * 3 + 1]
            var debugBox = new THREE.Mesh(bbgeometry, bbmaterial);
            debugBox.position.set(Math.round(x * 100) / 100, Math.round(y * 100) / 100, 0)
            scene.add(debugBox)
            coords.push([x, y])
        }

        commands.push(["path", coords])

    })
    sendCommands(commands)
}

const a3Width = 297
const a3Height = 420


function scalePlot(val) {
    lineObjects.forEach(obj => {
        obj.scale.set(val, val, val)

    })
}

function bakeScale() {
    lineObjects.forEach(obj => {
        obj.geometry.applyMatrix4(obj.matrix);
    });
    scalePlot(1)
}


function setupScene() {
    view = document.getElementById("plotViewContainer")

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("plotViewContainer").appendChild(renderer.domElement);


    camera = new THREE.OrthographicCamera(0, 500, 0, 500, 1, 10000);
    camera.lookAt(new THREE.Vector3());
    controls = new THREE.InteractiveControls(camera, renderer.domElement);

    scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(a3Width, a3Height, a3Width / 10, a3Height / 10);
    const material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x333333, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(a3Width / 2, a3Height / 2, 0)
    scene.add(plane);


    const linematerial = new THREE.LineBasicMaterial({
        color: 0xe61d5f
    });

    const points = [];
    points.push(new THREE.Vector3(a3Width, 0, 0));
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(0, a3Height, 0));

    const linegeometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(linegeometry, linematerial);
    scene.add(line);

    render()
    function render() {
        renderer.render(scene, camera);
        controls.update()
        if (boundingBox && container && scaleWidget) {
            container.position.copy(boundingBox.position)

            var scale = scaleWidget.position.length() / 140
            container.scale.set(scale, scale, scale)

        }

        requestAnimationFrame(render)
    }
}


function setupPlotView(doc) {

    paths = document.querySelectorAll("#svgContainer path")

    parseNodes(paths, scene)


}