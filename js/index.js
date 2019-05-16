// global variables 
var stats
var renderer
var scene
var camera, light, clothObject
var loader, clothTexture, clothMaterial, clothGeometry
var cloth
var clothWidth = 40
var clothHeight = 40
var particles = [];
var fabricLength = 400; // sets the size of the cloth
var restDistanceB = 2;
var restDistanceS = Math.sqrt(2);
var restDistance; // = fabricLength/clothWidth;
var structuralSprings = true;
var shearSprings = false;
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
var avoidClothSelfIntersection = false;
var friction = 0.9; // similar to coefficient of friction. 0 = frictionless, 1 = cloth sticks in place
var tmpForce = new THREE.Vector3();
var diff = new THREE.Vector3();
var randomPoints = [];
var rand, randX, randY;
var pos;
var guiEnabled = true;

//////////////////////////////////////////////////////////////////////////////


// var ballSize = 500 / 4; //40
// var ballPosition = new THREE.Vector3(0, -250 + ballSize, 0);
// var prevBallPosition = new THREE.Vector3(0, -250 + ballSize, 0);


// // var ray = new THREE.Raycaster();
// // var collisionResults, newCollisionResults;
// var whereAmI, whereWasI;
// // var directionOfMotion, distanceTraveled;

// var posFriction = new THREE.Vector3(0, 0, 0);
// var posNoFriction = new THREE.Vector3(0, 0, 0);

// var objectCenter = new THREE.Vector3();

// var a, b, c, d, e, f;

// var nearestX, nearestY, nearestZ;
// var currentX, currentY, currentZ;
// var xDist, yDist, zDist;

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

    scene.add(new THREE.AmbientLight(0x666666));
    light = new THREE.DirectionalLight(0xdfebff, 1.75);
    light.position.set(50, 200, 100);
    light.position.multiplyScalar(1.3);
    light.castShadow = true;
    // light.shadowCameraVisible = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    var d = 300;
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




    // console.log(scene)

    loader = new THREE.TextureLoader();
    clothTexture = loader.load("assets/patterns/bright_squares256.png");
    clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
    clothTexture.anisotropy = 16;


    // cloth material
    // this tells us the material's color, how light reflects off it, etc.

    clothMaterial = new THREE.MeshPhongMaterial({
        color: 0x827171,
        specular: 0x030303,
        wireframeLinewidth: 2,
        map: clothTexture,
        side: THREE.DoubleSide,
        alphaTest: 0.5
    });

    clothGeometry = new THREE.ParametricGeometry(clothInitialPosition, clothWidth, clothHeight);
    clothGeometry.dynamic = true;




    clothObject = new THREE.Mesh(clothGeometry, clothMaterial);
    clothObject.position.set(0, 0, 0);
    scene.add(clothObject)

    document.body.appendChild(renderer.domElement);

    cloth = new Cloth(clothWidth, clothHeight, fabricLength);
    pinCloth('OneEdge');

}

function clothInitialPosition(u, v) {

    let width = 500, height = 500
    let x = u * width - width / 2;
    let y = 125; //height/2;
    let z = v * height - height / 2;


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
            randY = Math.round(Math.random() * ySegs);
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

function wireFrame(){

    // poleMat.wireframe = !poleMat.wireframe;
    clothMaterial.wireframe = !clothMaterial.wireframe;
    // ballMaterial.wireframe = !ballMaterial.wireframe;
  
  }

function render() {
    var timer = Date.now() * 0.0002;


    // update position of the cloth
    // i.e. copy positions from the particles (i.e. result of physics simulation)
    // to the cloth geometry
    var p = cloth.particles;
    for (var i = 0, il = p.length; i < il; i++) {
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
        var cameraRadius = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z);
        camera.position.x = Math.cos(timer) * cameraRadius;
        camera.position.z = Math.sin(timer) * cameraRadius;
    }

    camera.lookAt(scene.position);
    renderer.render(scene, camera);

}

function simulate(time) {

    var i, il, particles, particle, pt, constrains, constrain;

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
        var face, faces = clothGeometry.faces, normal;
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

    if(avoidClothSelfIntersection){
        for ( i = 0; i < particles.length; i ++ ){
          p_i = particles[i];
          for ( j = 0; j < particles.length; j ++ ){
            p_j = particles[j];
            cloth.repelParticles(p_i,p_j,restDistance);
          }
        }
      }

    // Pin Constrains
    if (cornersPinned) {
        // could also do particles[blah].lock() which will lock particles to wherever they are, not to their original position
        particles[cloth.index(0, 0)].lockToOriginal();
        particles[cloth.index(clothWidth, 0)].lockToOriginal();
        particles[cloth.index(0, ySegs)].lockToOriginal();
        particles[cloth.index(clothWidth, ySegs)].lockToOriginal();
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


    var time = Date.now();
    simulate(time);
    render();
    stats.update();
    requestAnimationFrame(animate);
};

setup()
animate()