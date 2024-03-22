class DraggableController {
    constructor(object, camera, domElement) {
        this.object = object;
        this.camera = camera;
        this.domElement = domElement || document.body;

        this.enabled = true;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.intersection = new THREE.Vector3();
        this.offset = new THREE.Vector3();

        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    }

    onMouseDown(event) {
        if (!this.enabled) return;

        event.preventDefault();

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.object);

        if (intersects.length > 0) {
            this.intersection.copy(intersects[0].point);
            this.offset.copy(this.intersection).sub(this.object.position);
            this.domElement.style.cursor = 'move';
            this.domElement.addEventListener('mousemove', this.onDrag.bind(this), false);
        }
    }

    onMouseMove(event) {
        if (!this.enabled) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.object);

        if (intersects.length > 0) {
            this.domElement.style.cursor = 'pointer';
        } else {
            this.domElement.style.cursor = 'auto';
        }
    }

    onDrag(event) {
        if (!this.enabled) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const plane = new THREE.Plane();
        plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(plane.normal), this.intersection);

        const ray = new THREE.Ray();
        ray.set(this.raycaster.ray.origin, this.raycaster.ray.direction);

        const distance = ray.distanceToPlane(plane);

        const newPos = ray.at(distance);
        this.object.position.copy(newPos.sub(this.offset));
    }

    onMouseUp(event) {
        if (!this.enabled) return;

        this.domElement.style.cursor = 'auto';
        this.domElement.removeEventListener('mousemove', this.onDrag.bind(this), false);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}
