class AppModel {

    dom_element = undefined

    camera_position = [0,0]
    zoom = 100
    aspect = 1

    

}


class PlotModel {

    constructor(paths, position, scale) {
        this.position = position
        this.paths = paths
        this.scale = scale
    }
}