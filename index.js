// global variables 
var stats
var renderer
var scene
var camera, light, clothObject
var loader, clothTexture, clothMaterial, clothGeometry
var clothWidth = 40
var clothHeight = 40
var particles = [];

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
}

function clothInitialPosition(u, v) {

    let width = 500, height = 500
    let x = u * width - width / 2;
    let y = 125; //height/2;
    let z = v * height - height / 2;

    // console.log('u ' + u + ' v ' + v)

    // console.log(x + ' ' + y + ' ' + z)

    return new THREE.Vector3(x, y, z);
}

function createParitcles() {

    for (var i = 0; i <= clothHeight; i++) {
        for (var j = 0; j <= clothWidth; j++) {
            particles.push(new Particle(i / clothHeight, j / clothWidth))

        }
    }
}

function render() {

    for (var i = 0; i < particles.length; i++) {
        clothGeometry.vertices[i].copy(particles[i].position);

    }

}

function animate() {

    renderer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate);
};

setup()
createParitcles()
animate()