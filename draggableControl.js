class DraggableController {
    outlineColor = 0x666688;  
    hoverScaleColor = 0x66ff66;  
    hoverTranslateColor = 0x66ffff;  

    outlineMaterial = new THREE.LineBasicMaterial({ color: this.outlineColor })

    createOutline(obj) {

        // Create rectangle geometry and material
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, -1, 0),
            new THREE.Vector3(1, -1, 0),
            new THREE.Vector3(1, 1, 0),
            new THREE.Vector3(-1, 1, 0),
            new THREE.Vector3(-1, -1, 0) // close the rectangle
        ]);

        this.boundingRectangle = new THREE.Line(geometry, this.outlineMaterial);

        const worldMatrix = new THREE.Matrix4().invert(obj.matrixWorld);
        const boundingBox = new THREE.Box3().setFromObject(obj);
        const worldBoundingBox = boundingBox.clone();
        worldBoundingBox.applyMatrix4(worldMatrix);

        // worldBoundingBox.getCenter(this.boundingRectangle.position)
        worldBoundingBox.getSize(this.boundingRectangle.scale)
        this.boundingRectangle.scale.multiplyScalar(0.5)
        obj.add(this.boundingRectangle);
    }

    constructor(canvasControl, object, camera, domElement) {
        this.object = object;
        this.camera = camera;
        this.domElement = domElement || document.body;
        this.canvasControl = canvasControl
        this.enabled = false;
        this.mode = null;
        this.isHovering = false;

        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.intersection = new THREE.Vector3();
        this.offset = new THREE.Vector3();

        this.initialScale = new THREE.Vector3();

        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);

        this.createOutline(this.object)

        this.backplane = new THREE.Plane();
        this.backplane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0));

        // cetner dot 
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const geometry = new THREE.BoxGeometry();
        const cube = new THREE.Mesh(geometry, material);

        this.object.add(cube)
    }


    onMouseDown(event) {
        if (!this.enabled) return;

        event.preventDefault();
        event.stopPropagation();
        const intersects = this.raycaster.intersectObject(this.boundingRectangle);

        
        if (intersects.length > 0) {
            this.raycaster.ray.intersectPlane(this.backplane, this.intersection)

            const bbox = new THREE.Box3().setFromObject(this.object);
            const center = bbox.getCenter(new THREE.Vector3());

            const distToCenter = center.distanceTo(this.intersection);
            var bbox_dim = bbox.getSize(new THREE.Vector3())

            const largest_edge = Math.max(bbox_dim.x, bbox_dim.y) / 4;

            if (distToCenter <= largest_edge) {
                this.domElement.style.cursor = 'move'; // Change cursor for scaling
                this.mode = 'translate';
                this.offset.copy(this.intersection).sub(this.object.position);
                this.domElement.style.cursor = 'move';

            } else {
                this.mode = 'scale';
                this.domElement.style.cursor = 'n-resize'; // Change cursor for scaling
                this.initialScale.copy(this.object.scale);
                this.initialDistance = this.intersection.distanceTo(center);
            }
        }
    }

    getMoveType() {
        const bbox = new THREE.Box3().setFromObject(this.object);
        const center = bbox.getCenter(new THREE.Vector3());

        const distToCenter = center.distanceTo(this.intersection);
        var bbox_dim = bbox.getSize(new THREE.Vector3())

        const largest_edge = Math.max(bbox_dim.x, bbox_dim.y) / 4;

        if (distToCenter <= largest_edge) {
            this.domElement.style.cursor = 'move'; // Change cursor for scaling
            this.mode = 'translate';
            this.offset.copy(this.intersection).sub(this.object.position);
            this.domElement.style.cursor = 'move';

        } else {
            this.mode = 'scale';
            this.domElement.style.cursor = 'n-resize'; // Change cursor for scaling
            this.initialScale.copy(this.object.scale);
            this.initialDistance = this.intersection.distanceTo(center);
        }
    }

    onMouseEnter() {
        // this.canvasControl.disable()
        this.outlineMaterial.color.setHex( this.hoverTranslateColor );
    }   

    onMouseExit() {
        // this.canvasControl.enable()
        this.outlineMaterial.color.setHex( this.outlineColor );
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (!this.enabled) return;


        this.raycaster.ray.intersectPlane(this.backplane, this.intersection)

        if (this.mode === 'translate') {
            event.preventDefault();
            event.stopPropagation();
            this.object.position.copy(this.intersection.sub(this.offset));
        
        } else if (this.mode === 'scale') {
            event.preventDefault();
            event.stopPropagation();
            const bbox = new THREE.Box3().setFromObject(this.object);
            const center = bbox.getCenter(new THREE.Vector3());
    
            const currentDistance = this.intersection.distanceTo(center);
            const scaleFactor = currentDistance / this.initialDistance;
    
            this.object.scale.copy(this.initialScale).multiplyScalar(scaleFactor);

        } else {
            const intersects = this.raycaster.intersectObject(this.boundingRectangle);
        
            if (intersects.length > 0) {
                this.domElement.style.cursor = this.mode === 'translate' ? 'move' : 'n-resize';
                
                if (!this.isHovering) {
                    this.isHovering = true
                    this.onMouseEnter()
                }
            } else {
                if (this.isHovering) {
                    this.isHovering = false
                    this.onMouseExit()
                }
                this.domElement.style.cursor = 'auto';
            }
        }
    }

    onDrag(event) {
        if (!this.enabled || this.mode !== 'translate') return;

    }

    onScale(event) {
        if (!this.enabled || this.mode !== 'scale') return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

    }

    onMouseUp(event) {
        if (!this.enabled) return;

        this.mode = "none"

        this.domElement.style.cursor = 'auto';
        // this.domElement.removeEventListener('mousemove', this.onDrag.bind(this), false);
        // this.domElement.removeEventListener('mousemove', this.onScale.bind(this), false);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}
