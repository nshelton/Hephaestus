

uuidv4 = function() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}


class AppModel {

    created_time= undefined
    modified_time = undefined
    project_name = undefined

    camera_position = {x:100, y:100}
    zoom = 300
    plot_models = []
}
 

class PlotModel {

    constructor(paths, position, scale) {
        this.position = position
        this.paths = paths
        this.scale = scale
        this.id = uuidv4()
        this.bbox = new THREE.Box3()
        this.state = "none"
    }
}