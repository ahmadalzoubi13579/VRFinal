if (!Detector.webgl) Detector.addGetWebGLMessage();

// global letiables
let stats
let renderer
let scene
let camera, light, clothObject
let loader, clothTexture, clothMaterial, clothGeometry
let cloth
let fabricLength = 300;
let clothWidth = Math.round(fabricLength / 20)
let clothHeight = Math.round(fabricLength / 20)
let particles = [];
let restDistanceB = 2;
let restDistanceS = Math.sqrt(2);
let restDistance; // = fabricLength/clothWidth;
let structuralSprings = true;
let shearSprings = false;
let bendingSprings = false;
let DAMPING = 0.03;
let DRAG = 1 - DAMPING;
let MASS = .1;
let wind = false;
let windStrength;
let windForce = new THREE.Vector3(0, 0, 0);
let GRAVITY = 9.81 * 140; //
let gravity = new THREE.Vector3(0, - GRAVITY, 0).multiplyScalar(MASS);
let TIMESTEP = 18 / 1000;
let TIMESTEP_SQ = TIMESTEP * TIMESTEP;
let rotate = false;
let pinned = 'OneEdge';
let cornersPinned, oneEdgePinned, twoEdgesPinned, fourEdgesPinned, randomEdgesPinned;
let avoidClothSelfIntersection = true;
let friction = 0.9; // similar to coefficient of friction. 0 = frictionless, 1 = cloth sticks in place
let tmpForce = new THREE.Vector3();
let diff = new THREE.Vector3();
let randomPoints = [];
let rand, randX, randY;
let pos;
let gui;
let guiControls;
let guiEnabled = true;
let groundTexture
let groundMaterial
let mesh
let poleGeo
let poleMat
let poleRight
let poleLeft
let showPoles = true
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let intersects
let sphereMaterial
let cubeMaterial
let spherePosition
let spherePrevPosition

let sphere
let object2
let radius = 40
let selected
let clothSelected
let mousePosition = new THREE.Vector3()
let objects = [];
let closestParticleIndex
let cube
let thing = 'None'
let moveWithMouse = false

//////////////////////////////////////////////////////////////////////////////


// let ballSize = 500 / 4; //40
// let ballPosition = new THREE.Vector3(0, -250 + ballSize, 0);
// let prevBallPosition = new THREE.Vector3(0, -250 + ballSize, 0);


// // let ray = new THREE.Raycaster();
// // let collisionResults, newCollisionResults;
// let whereAmI, whereWasI;
// // let directionOfMotion, distanceTraveled;

// let posFriction = new THREE.Vector3(0, 0, 0);
// let posNoFriction = new THREE.Vector3(0, 0, 0);

// let objectCenter = new THREE.Vector3();


// let a, b, c, d, e, f;

// let nearestX, nearestY, nearestZ;
// let currentX, currentY, currentZ;
// let xDist, yDist, zDist;

//////////////////////////////////////////////////////////////////////////////


function setup() {

    // stats
    stats = new Stats();
    document.body.appendChild(stats.domElement);

    // scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.y = 350;
    camera.position.z = 1500;
    scene.add(camera);

    // light
    scene.add(new THREE.AmbientLight(0xffffff));
    light = new THREE.DirectionalLight(0xdfebff, 1.75);
    light.position.set(50, 200, 100);
    light.position.multiplyScalar(1.3);
    light.castShadow = true;
    // light.shadowCameraVisible = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    let d = 500;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 1000;
    scene.add(light);

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, devicePixelRatio: 1 });
    //renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene.fog.color);
    // renderer.setClearColor(0xffffff);

    // container.appendChild(renderer.domElement);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    // scene.background = new THREE.Color(0x343434);

    // ground
    groundMaterial = new THREE.MeshPhongMaterial(
        {
            color: 0x404761,//0x3c3c3c,
            specular: 0x404761,//0x3c3c3c//,
        });

    mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(20000, 20000), groundMaterial);
    mesh.position.y = -250;
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.material.needsUpdate = true;

    loader = new THREE.TextureLoader();
    groundTexture = loader.load("assets/images/Ground Textures/wood floor.jpg", function (map) {
        mesh.material.map = map;
        mesh.material.needsUpdate = true;
    });
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(25, 25);
    groundTexture.anisotropy = 16;

    scene.add(mesh); // add ground to scene

    // poles
    poleGeo = new THREE.BoxGeometry(5, 250 + 125, 5);
    poleMat = new THREE.MeshPhongMaterial({ color: 0x595959, specular: 0x111111, shininess: 100, side: THREE.DoubleSide });

    poleRight = new THREE.Mesh(poleGeo, poleMat);
    poleRight.position.x = 153;
    poleRight.position.z = -150;
    poleRight.position.y = -(125 - 125 / 2);
    poleRight.receiveShadow = true;
    poleRight.castShadow = true;
    scene.add(poleRight);

    poleLeft = new THREE.Mesh(poleGeo, poleMat);
    poleLeft.position.x = -153;
    poleLeft.position.z = -150;
    poleLeft.position.y = -62;
    poleLeft.receiveShadow = true;
    poleLeft.castShadow = true;
    scene.add(poleLeft);


    // Cloth

    clothMaterial = new THREE.MeshPhongMaterial({
        color: 0x827171,
        specular: 0x030303,
        wireframeLinewidth: 2,
        side: THREE.DoubleSide,
        alphaTest: 0.5
    });

    clothGeometry = new THREE.ParametricGeometry(clothInitialPosition, clothWidth, clothHeight);
    clothGeometry.dynamic = true;

    clothObject = new THREE.Mesh(clothGeometry, clothMaterial);
    clothObject.castShadow = true;
    clothObject.position.set(0, 0, 0);

    clothTexture = loader.load("assets/images/Cloth Textures/6873.jpg", function (map) {
        clothObject.material.map = map;
        clothObject.material.needsUpdate = true;
    });
    clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
    clothTexture.anisotropy = 16;
    scene.add(clothObject)
    objects.push(clothObject)

    let sphereGeometry = new THREE.SphereGeometry(radius, 24, 24);
    sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xe8a451 });
    sphereMaterial.transparent = true;
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    radius = 40;
    spherePosition = new THREE.Vector3(100, 10, -150);
    spherePrevPosition = new THREE.Vector3(100, 10, -150);
    sphere.position.copy(spherePosition)
    scene.add(sphere)

    let cubeGeometry = new THREE.BoxGeometry(100, 100, 200);
    cubeMaterial = new THREE.MeshPhongMaterial({ color: 0xe8a451 });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.z = -200
    scene.add(cube);

    cloth = new Cloth(clothWidth, clothHeight, fabricLength);

    pinCloth('OneEdge');
    showObject('None')

    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    if (guiEnabled) {

        guiControls = new function () {
            this.friction = friction;
            this.particles = clothWidth;
            this.rotate = rotate;

            this.wind = wind;
            this.showPoles = showPoles
            this.thing = thing;
            this.pinned = pinned;
            this.moveWithMouse = moveWithMouse

            this.avoidClothSelfIntersection = avoidClothSelfIntersection;

            this.fabricLength = fabricLength;
            this.structuralSprings = structuralSprings;

            this.bendingSprings = bendingSprings;
            this.bendingSpringLengthMultiplier = restDistanceB;

            this.shearSprings = shearSprings;
            this.shearSpringLengthMultiplier = restDistanceS;

            this.clothColor = 0xaa2929;
            this.clothSpecular = 0x030303;

            this.groundColor = 0x404761;
            this.groundSpecular = 0x404761;

            this.fogColor = 0xcce0ff;

        };

        gui = new dat.GUI();
        gui.closed = false
        // gui.width = 370

        // console.log(gui)

        let f0 = gui.add(guiControls, 'fabricLength', 200, 1000).step(20).name('Size').onChange(function (value) { fabricLength = value; clothWidth = Math.round(value / 20); clothHeight = Math.round(value / 20); restartCloth(); });

        let f4 = gui.addFolder('Interaction')

        f4.add(guiControls, 'rotate').name('Auto Rotate').onChange(function (value) { rotate = value; });
        f4.add(guiControls, 'wind').name('Wind').onChange(function (value) { wind = value; });
        f4.add(guiControls, 'showPoles').name('Show Poles').onChange(function (value) { showPoles = value; modifyPoles() });
        f4.add(guiControls, 'moveWithMouse').name('Move With Mouse').onChange(function (value) { enableMoveWithMouse(value); });
        f4.add(guiControls, 'thing', ['None', 'Sphere', 'Cube', 'All']).name('Object').onChange(function (value) { showObject(value) });
        f4.add(guiControls, 'pinned', ['None', 'Corners', 'OneEdge', 'TwoEdges', 'FourEdges', 'Random']).name('Pinned').onChange(function (value) { pinCloth(value); });

        let f1 = gui.addFolder('Behavior');

        f1.add(guiControls, 'structuralSprings').name('Structural Springs').onChange(function (value) { structuralSprings = value; restartCloth(); });
        f1.add(guiControls, 'shearSprings').name('Shear Springs').onChange(function (value) { shearSprings = value; restartCloth(); });
        f1.add(guiControls, 'bendingSprings').name('Bending Springs').onChange(function (value) { bendingSprings = value; restartCloth(); });
        f1.add(guiControls, 'friction', 0, 1).name('Friction').onChange(function (value) { friction = value; });
        f1.add(guiControls, 'avoidClothSelfIntersection').name('Avoid SelfIntersect').onChange(function (value) { avoidClothSelfIntersection = value; });
        //f1.add(guiControls, 'weight', 0, 500).step(1).onChange(function(value){weight = value; restartCloth();});

        let f3 = gui.addFolder('Appearance');
        f3.addColor(guiControls, 'clothColor').name('Cloth Color').onChange(function (value) { clothMaterial.color.setHex(value); });
        f3.addColor(guiControls, 'clothSpecular').name('Cloth Reflection').onChange(function (value) { clothMaterial.specular.setHex(value); });
        f3.addColor(guiControls, 'groundColor').name('Ground Color').onChange(function (value) { groundMaterial.color.setHex(value); });
        f3.addColor(guiControls, 'groundSpecular').name('Ground Reflection').onChange(function (value) { groundMaterial.specular.setHex(value); });
        f3.addColor(guiControls, 'fogColor').name('Fog Color').onChange(function (value) { scene.fog.color.setHex(value); renderer.setClearColor(scene.fog.color); });

    }


    // let dragControls = new THREE.DragControls(objects, camera, renderer.domElement);
    // dragControls.addEventListener('dragstart', function () {
    //     // controls.enabled = false;
    //     console.log('start')
    // });
    // dragControls.addEventListener('dragend', function () {
    //     // controls.enabled = true;
    //     console.log('end')
    // });


}

function onMouseDown(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(objects);

    // Detect The Intersetced Objects

    if (intersects.length) {
        selected = intersects[0].object
        if (intersects[0].object.geometry.type === 'ParametricGeometry') {
            clothSelected = true
        }

    }

    // convert 2D mouse Coordinate System to THREE.JS Coordinate System
    // mouse(x,y) ==> THREE.js(x,y,0)

    let vector = new THREE.Vector3();
    vector.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1, 0.5);
    vector.unproject(camera);
    let dir = vector.sub(camera.position).normalize();
    let distance = - camera.position.z / dir.z;
    mousePosition = camera.position.clone().add(dir.multiplyScalar(distance));

    closestParticleIndex = getClosestParticle(cloth.particles, mousePosition)


}

function onMouseMove(event) {


    let vector = new THREE.Vector3();
    vector.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1, 0.5);
    vector.unproject(camera);
    let dir = vector.sub(camera.position).normalize();
    let distance = - camera.position.z / dir.z;
    mousePosition = camera.position.clone().add(dir.multiplyScalar(distance));

    // move any selected object except Cloth
    if (selected && !clothSelected) {
        mousePosition.setZ(selected.position.z)
        selected.position.copy(mousePosition)
    }



}

function onMouseUp(event) {
    selected = null
    clothSelected = false
}

function getClosestParticle(particles, mousePosition) {

    let min = 1000
    let index
    let tempPosition = new THREE.Vector3()

    for (let i = 0; i < particles.length; i++) {
        tempPosition.copy(particles[i].position)
        tempPosition.setZ(0)
        let dis = mousePosition.distanceTo(tempPosition)
        if (dis < min) {
            min = dis
            index = i
        }
    }

    return index
}

function isIntersectWithSphere(point, spherePosition) {

    // let diff = new THREE.Vector3()
    // let posNoFriction = new THREE.Vector3()
    // diff.subVectors(point.position, spherePosition);

    // if (diff.length() < radius) {

    //     console.log('ball collision');

    //     // console.log(spherePosition)

    //     // let diff = radius - point.distanceTo(spherePosition)
    //     // point.addScalar(diff)
    //     // // console.log(diff)
    //     // let newVector = new THREE.Vector3()
    //     // newVector.copy(point).addScalar(diff)
    //     // console.log(point)
    //     // point.addScalar(diff)
    //     // point.add(newVector)

    //     // diff.normalize().multiplyScalar(radius)
    //     // posNoFriction.copy(spherePosition).add(diff)
    //     // point.position.copy(posNoFriction)



    // }

    let particle = point
    let whereAmI = particle.position;
    let whereWasI = particle.previous;
    let ballPosition = spherePosition
    let prevBallPosition = spherePrevPosition
    let posNoFriction = new THREE.Vector3()
    let posFriction = new THREE.Vector3()

    // console.log(prevBallPosition)


    // check to see if point is inside sphere


    diff.subVectors(whereAmI, ballPosition);
    if (diff.length() < radius) {
        // if yes, we've collided, so take correcting action

        // no friction behavior:
        // project point out to nearest point on sphere surface
        diff.normalize().multiplyScalar(radius);
        posNoFriction.copy(ballPosition).add(diff);

        diff.subVectors(whereWasI, ballPosition);

        if (diff.length() > radius) {

            // console.log('greater than')
            // with friction behavior:
            // add the distance that the sphere moved in the last frame
            // to the previous position of the particle
            diff.subVectors(ballPosition, prevBallPosition);
            posFriction.copy(whereWasI).add(diff);

            posNoFriction.multiplyScalar(1 - friction);
            posFriction.multiplyScalar(friction);
            whereAmI.copy(posFriction.add(posNoFriction));
        }
        else {
            whereAmI.copy(posNoFriction);
        }

    }


}

function isIntersectWithCube(point, cubePosition, width, height, depth) {

    if ((point.x >= cubePosition.x - width / 2 && point.x <= cubePosition.x + width / 2) &&
        (point.y >= cubePosition.y - height / 2 && point.y <= cubePosition.y + height / 2) &&
        (point.z >= cubePosition.z - depth / 2 && point.z <= cubePosition.z + depth / 2)

    ) {
        console.log('cube collistion')
    }
}

function calculateSize(object) {

    let objectList = [];
    let stack = [object];
    let bytes = 0;

    while (stack.length) {
        let value = stack.pop();

        if (typeof value === 'boolean') {
            bytes += 4;
        }
        else if (typeof value === 'string') {
            bytes += value.length * 2;
        }
        else if (typeof value === 'number') {
            bytes += 8;
        }
        else if
            (
            typeof value === 'object'
            && objectList.indexOf(value) === -1
        ) {
            objectList.push(value);

            for (let i in value) {
                stack.push(value[i]);
            }
        }
    }
    return bytes;
}

function clothInitialPosition(u, v, target) {

    let x = u * fabricLength - fabricLength / 2;
    let y = 125;
    let z = v * fabricLength - fabricLength / 2;

    target.set(x, y, z)
}

function pinCloth(choice) {
    if (choice == 'Corners') {
        cornersPinned = true;
        oneEdgePinned = false;
        twoEdgesPinned = false;
        fourEdgesPinned = false;
        randomEdgesPinned = false;
    }
    else if (choice == 'OneEdge') {
        cornersPinned = false;
        oneEdgePinned = true;
        twoEdgesPinned = false;
        fourEdgesPinned = false;
        randomEdgesPinned = false;
    }
    else if (choice == 'TwoEdges') {
        cornersPinned = false;
        oneEdgePinned = false;
        twoEdgesPinned = true;
        fourEdgesPinned = false;
        randomEdgesPinned = false;
    }
    else if (choice == 'FourEdges') {
        cornersPinned = false;
        oneEdgePinned = false;
        twoEdgesPinned = false;
        fourEdgesPinned = true;
        randomEdgesPinned = false;
    }
    else if (choice == 'Random') {
        cornersPinned = false;
        oneEdgePinned = false;
        twoEdgesPinned = false;
        fourEdgesPinned = false;
        randomEdgesPinned = true;

        rand = Math.round(Math.random() * 10) + 1;
        randomPoints = [];
        for (u = 0; u < rand; u++) {
            randX = Math.round(Math.random() * clothWidth);
            randY = Math.round(Math.random() * clothHeight);
            randomPoints.push([randX, randY]);
        }
    }
    else if (choice == 'None') {
        cornersPinned = false;
        oneEdgePinned = false;
        twoEdgesPinned = false;
        fourEdgesPinned = false;
        randomEdgesPinned = false;
    }
}

function showObject(object) {
    if (object == 'None') {
        sphere.visible = false
        cube.visible = false
    }
    else if (object == 'Sphere') {
        sphere.visible = true
        cube.visible = false
    }
    else if (object == 'Cube') {
        cube.visible = true
        sphere.visible = false
    }
    else {
        cube.visible = true
        sphere.visible = true
    }
}

function enableMoveWithMouse(enable) {
    if (enable) {
        objects.push(sphere)
        objects.push(cube)
    }
    else {
        objects.pop()
        objects.pop()
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}

function restartCloth() {

    scene.remove(clothObject);
    cloth = new Cloth(clothWidth, clothHeight, fabricLength);

    clothGeometry = new THREE.ParametricGeometry(clothInitialPosition, clothWidth, clothHeight);
    clothGeometry.dynamic = true;

    // recreate cloth mesh
    clothObject = new THREE.Mesh(clothGeometry, clothMaterial);
    clothObject.position.set(0, 0, 0);
    clothObject.castShadow = true;

    scene.add(clothObject); // adds the cloth to the scene
}

function modifyPoles() {
    if (showPoles) {
        scene.add(poleLeft)
        scene.add(poleRight)
    }
    else {
        scene.remove(poleLeft)
        scene.remove(poleRight)
    }
}

function wireFrame() {

    // cubeMaterial.wireframe = !cubeMaterial.wireframe;
    clothMaterial.wireframe = !clothMaterial.wireframe;
    // sphereMaterial.wireframe = !sphereMaterial.wireframe;

}

function render() {

    let timer = Date.now() * 0.0002;

    // update position of the cloth
    // i.e. copy positions from the particles (i.e. result of physics simulation)
    // to the cloth geometry
    let p = cloth.particles;
    for (let i = 0, il = p.length; i < il; i++) {
        clothGeometry.vertices[i].copy(p[i].position);
    }

    // recalculate cloth normals
    clothGeometry.computeFaceNormals();
    clothGeometry.computeVertexNormals();

    clothGeometry.normalsNeedUpdate = true;
    clothGeometry.verticesNeedUpdate = true;

    // update sphere position from ball position
    // sphere.position.copy(ballPosition);

    // option to auto-rotate camera
    if (rotate) {
        let cameraRadius = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z);
        camera.position.x = Math.cos(timer) * cameraRadius;
        camera.position.z = Math.sin(timer) * cameraRadius;
    }




    camera.lookAt(scene.position);
    renderer.render(scene, camera);

}

function simulate(time) {

    let i, il, particles, particle, pt, constrains, constrain;
    particles = cloth.particles

    // Aerodynamics forces
    if (wind) {

        windStrength = Math.cos(time / 7000) * 20 + 40;
        windForce.set(
            Math.sin(time / 2000),
            Math.cos(time / 3000),
            Math.sin(time / 1000)
            //  1,1,1
        ).normalize().multiplyScalar(windStrength);

        // apply the wind force to the cloth particles
        let face, faces = clothGeometry.faces, normal;
        particles = cloth.particles;
        for (i = 0, il = faces.length; i < il; i++) {
            face = faces[i];
            normal = face.normal;
            tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(windForce));
            // tmpForce.copy( normal ).normalize().multiplyScalar( windForce.length() );
            particles[face.a].addForce(tmpForce);
            particles[face.b].addForce(tmpForce);
            particles[face.c].addForce(tmpForce);
        }

    }

    
    for (i = 0; i < cloth.particles.length; i++) {
        particle = particles[i];
        particle.addForce(gravity);
        particle.integrate(TIMESTEP_SQ); // performs verlet integration
    }
    
    // mvoe cloth with mouse

    if (clothSelected) {
        particles[closestParticleIndex].position.copy(mousePosition)
    }

    if (sphere.visible) {
        for (let i = 0; i < particles.length; i++) {

            isIntersectWithSphere(particles[i], sphere.position)
        }
    }
    // Detect Collision

    // console.log(particles)


    if (cube.visible) {
        for (let i = 0; i < particles.length; i++) {

            isIntersectWithCube(particles[i].position, cube.position, 100, 100, 200)
        }

    }


    // Start Constrains

    constrains = cloth.constrains,
        il = constrains.length;
    for (i = 0; i < il; i++) {
        constrain = constrains[i];
        cloth.satisifyConstrains(constrain[0], constrain[1], constrain[2]);
    }

    // Floor Constains
    for (particles = cloth.particles, i = 0, il = particles.length
        ; i < il; i++) {
        particle = particles[i];
        pos = particle.position;
        if (pos.y < - 249) { pos.y = - 249; }
    }

    if (avoidClothSelfIntersection) {
        for (i = 0; i < particles.length; i++) {
            p_i = particles[i];
            for (j = 0; j < particles.length; j++) {
                p_j = particles[j];
                cloth.repelParticles(p_i, p_j, restDistance);
            }
        }
    }

    // Pin Constrains
    if (cornersPinned) {
        // could also do particles[blah].lock() which will lock particles to wherever they are, not to their original position
        particles[cloth.index(0, 0)].lockToOriginal();
        particles[cloth.index(clothWidth, 0)].lockToOriginal();
        particles[cloth.index(0, clothHeight)].lockToOriginal();
        particles[cloth.index(clothWidth, clothHeight)].lockToOriginal();
    }

    else if (oneEdgePinned) {
        for (u = 0; u <= clothWidth; u++) {
            particles[cloth.index(u, 0)].lockToOriginal();
        }
    }

    else if (twoEdgesPinned) {
        for (u = 0; u <= clothWidth; u++) {
            particles[cloth.index(0, u)].lockToOriginal();
            particles[cloth.index(clothWidth, u)].lockToOriginal();
        }
    }

    else if (fourEdgesPinned) {
        for (u = 0; u <= clothWidth; u++) {
            particles[cloth.index(0, u)].lockToOriginal();
            particles[cloth.index(clothWidth, u)].lockToOriginal();
            particles[cloth.index(u, 0)].lockToOriginal();
            particles[cloth.index(u, clothWidth)].lockToOriginal();
        }
    }

    else if (randomEdgesPinned) {
        for (u = 0; u < randomPoints.length; u++) {
            rand = randomPoints[u];
            randX = rand[0];
            randY = rand[1];
            particles[cloth.index(randX, randY)].lockToOriginal();
        }
    }



    // console.log(particles)
}

function animate() {

    let time = Date.now();
    simulate(time);
    render();
    stats.update();
    requestAnimationFrame(animate);
};

setup()
animate()
