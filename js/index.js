if (!Detector.webgl) Detector.addGetWebGLMessage();

// global letiables
var stats
var renderer
var scene
var camera, light, clothObject
var loader, clothTexture, clothMaterial, clothGeometry
var cloth
var fabricLength = 400;
var clothWidth = Math.round(fabricLength / 20)
var clothHeight = Math.round(fabricLength / 20)
var particles = [];
var restDistanceB = 2;
var restDistanceS = Math.sqrt(2);
var restDistance; // = fabricLength/clothWidth;
var structuralSprings = true;
var shearSprings = true;
var bendingSprings = true;
var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = .1;
var wind = true;
var windStrength;
var windForce = new THREE.Vector3(0, 0, 0);
var GRAVITY = 9.81 * 140; //
var gravity = new THREE.Vector3(0, - GRAVITY, 0).multiplyScalar(MASS);
var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;
var rotate = false;
var pinned = 'Corners';
var thing = 'Ball'
var cornersPinned, oneEdgePinned, twoEdgesPinned, fourEdgesPinned, randomEdgesPinned;
var avoidClothSelfIntersection = true;
var friction = 0.9; // similar to coefficient of friction. 0 = frictionless, 1 = cloth sticks in place
var tmpForce = new THREE.Vector3();
var diff = new THREE.Vector3();
var randomPoints = [];
var rand, randX, randY;
var pos;
var gui;
var guiControls;
var guiEnabled = true;
var groundTexture
var groundMaterial
var mesh
var poleGeo
var poleMat
var poleRight
var poleLeft
var showPoles = true
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersects

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
    poleRight.position.x = 200;
    poleRight.position.z = -200;
    poleRight.position.y = -(125 - 125 / 2);
    poleRight.receiveShadow = true;
    poleRight.castShadow = true;
    scene.add(poleRight);

    poleLeft = new THREE.Mesh(poleGeo, poleMat);
    poleLeft.position.x = -200;
    poleLeft.position.z = -200;
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

    document.body.appendChild(renderer.domElement);

    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    cloth = new Cloth(clothWidth, clothHeight, fabricLength);
    pinCloth('OneEdge');

    if (guiEnabled) {

        guiControls = new function () {
            this.friction = friction;
            this.particles = clothWidth;
            this.rotate = rotate;

            this.wind = wind;
            this.showPoles = showPoles
            this.thing = thing;
            this.pinned = pinned;

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
        gui.closed = true

        let f0 = gui.add(guiControls, 'fabricLength', 200, 1000).step(20).name('Size').onChange(function (value) { fabricLength = value; clothWidth = Math.round(value / 20); clothHeight = Math.round(value / 20); restartCloth(); });

        let f4 = gui.addFolder('Interaction')

        f4.add(guiControls, 'rotate').name('Auto Rotate').onChange(function (value) { rotate = value; });
        f4.add(guiControls, 'wind').name('Wind').onChange(function (value) { wind = value; });
        f4.add(guiControls, 'showPoles').name('Show Poles').onChange(function (value) { showPoles = value; modifyPoles() });
        // f4.add(guiControls, 'thing', ['None', 'Ball', 'Table']).name('object').onChange(function(value){createThing(value);});
        f4.add(guiControls, 'pinned', ['None', 'Corners', 'OneEdge', 'TwoEdges', 'FourEdges']).name('Pinned').onChange(function (value) { pinCloth(value); });

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
}

function clothInitialPosition(u, v) {

    let drawWidth = 400, drawHeight = 400
    let x = u * drawWidth - drawWidth / 2;
    let y = 125; //height/2;
    let z = v * drawHeight - drawHeight / 2;


    return new THREE.Vector3(x, y, z);
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

function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;


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

    // poleMat.wireframe = !poleMat.wireframe;
    clothMaterial.wireframe = !clothMaterial.wireframe;
    // ballMaterial.wireframe = !ballMaterial.wireframe;

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

    raycaster.setFromCamera(mouse, camera);
    intersects = raycaster.intersectObjects(scene.children);
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.geometry.type === 'ParametricGeometry') {
            // intersects[ i ].object.material.color.set( 0xff0000 );
        }
    }

    // console.log(intersects);

    camera.lookAt(scene.position);
    renderer.render(scene, camera);

}

function simulate(time) {

    let i, il, particles, particle, pt, constrains, constrain;

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

    for (particles = cloth.particles, i = 0, il = particles.length; i < il; i++) {
        particle = particles[i];
        particle.addForce(gravity);
        particle.integrate(TIMESTEP_SQ); // performs verlet integration
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